/**
 * SessionTriggerHandler
 *
 * Handles before insert/update triggers on the Session__c object to prevent double booking.
 * Validates that a speaker does not have overlapping sessions on the same day.
 *
 * @author DF-4
 * @version 1.0
 */
public with sharing class SessionTriggerHandler {
    /**
     * Processes trigger events for Session__c records.
     * Calls appropriate handler methods based on trigger context.
     *
     * @param newRecords List of new/updated Session__c records from trigger.new
     * @param oldRecords List of old Session__c records from trigger.old (null for insert)
     * @param isInsert Boolean indicating if this is an insert operation
     * @param isUpdate Boolean indicating if this is an update operation
     */
    public static void handleTriggerEvent(
        List<Session__c> newRecords,
        List<Session__c> oldRecords,
        Boolean isInsert,
        Boolean isUpdate
    ) {
        if (isInsert || isUpdate) {
            preventDoubleBooking(newRecords, isUpdate ? oldRecords : null);
        }
    }

    /**
     * Prevents double booking of speakers by validating no overlapping sessions exist on the same day.
     *
     * @param newSessions List of new or updated Session__c records
     * @param oldSessions List of old Session__c records for updates; null for inserts
     */
    private static void preventDoubleBooking(List<Session__c> newSessions, List<Session__c> oldSessions) {
        Set<Id> speakerIds = collectSpeakerIds(newSessions);

        if (speakerIds.isEmpty()) {
            return;
        }

        Map<Id, Set<Date>> sessionDatesByDay = buildSessionDateMap(newSessions);
        Map<Id, Set<Id>> existingSessionIdsBySpeaker = getExistingSessionIds(newSessions, oldSessions);
        Map<Id, List<Session__c>> existingSessionsBySpeaker = queryExistingSessions(speakerIds);

        validateNoConflicts(newSessions, oldSessions, sessionDatesByDay, existingSessionIdsBySpeaker, existingSessionsBySpeaker);
    }

    /**
     * Collects all unique Speaker__c IDs from the new session records.
     *
     * @param newSessions List of Session__c records to extract speaker IDs from
     * @return Set of speaker IDs
     */
    private static Set<Id> collectSpeakerIds(List<Session__c> newSessions) {
        Set<Id> speakerIds = new Set<Id>();
        for (Session__c session : newSessions) {
            if (session.Speaker__c != null) {
                speakerIds.add(session.Speaker__c);
            }
        }
        return speakerIds;
    }

    /**
     * Builds a map of speaker IDs to their session dates for the current batch.
     *
     * @param newSessions List of Session__c records
     * @return Map of speaker ID to Set of session dates
     */
    private static Map<Id, Set<Date>> buildSessionDateMap(List<Session__c> newSessions) {
        Map<Id, Set<Date>> datesByDay = new Map<Id, Set<Date>>();
        for (Session__c session : newSessions) {
            if (session.Speaker__c != null && session.Start_Time__c != null) {
                Date sessionDate = Date.valueOf(session.Start_Time__c);
                if (!datesByDay.containsKey(session.Speaker__c)) {
                    datesByDay.put(session.Speaker__c, new Set<Date>());
                }
                datesByDay.get(session.Speaker__c).add(sessionDate);
            }
        }
        return datesByDay;
    }

    /**
     * Collects existing session IDs for records being updated to exclude them from conflict checks.
     *
     * @param newSessions List of new Session__c records
     * @param oldSessions List of old Session__c records (null for inserts)
     * @return Map of speaker ID to Set of session IDs to exclude
     */
    private static Map<Id, Set<Id>> getExistingSessionIds(List<Session__c> newSessions, List<Session__c> oldSessions) {
        Map<Id, Set<Id>> sessionIdsBySpeaker = new Map<Id, Set<Id>>();

        if (oldSessions == null) {
            return sessionIdsBySpeaker;
        }

        for (Session__c oldSession : oldSessions) {
            if (oldSession.Speaker__c != null && oldSession.Id != null) {
                if (!sessionIdsBySpeaker.containsKey(oldSession.Speaker__c)) {
                    sessionIdsBySpeaker.put(oldSession.Speaker__c, new Set<Id>());
                }
                sessionIdsBySpeaker.get(oldSession.Speaker__c).add(oldSession.Id);
            }
        }

        return sessionIdsBySpeaker;
    }

    /**
     * Queries existing sessions for the given speakers to detect potential conflicts.
     *
     * @param speakerIds Set of speaker IDs to query sessions for
     * @return Map of speaker ID to List of existing Session__c records
     */
    private static Map<Id, List<Session__c>> queryExistingSessions(Set<Id> speakerIds) {
        Map<Id, List<Session__c>> sessionsBySpeaker = new Map<Id, List<Session__c>>();

        List<Session__c> existingSessions = [
            SELECT Id, Speaker__c, Start_Time__c
            FROM Session__c
            WHERE Speaker__c IN :speakerIds
            WITH USER_MODE
        ];

        for (Session__c session : existingSessions) {
            if (!sessionsBySpeaker.containsKey(session.Speaker__c)) {
                sessionsBySpeaker.put(session.Speaker__c, new List<Session__c>());
            }
            sessionsBySpeaker.get(session.Speaker__c).add(session);
        }

        return sessionsBySpeaker;
    }

    /**
     * Validates that no conflicting sessions exist and adds errors to records as needed.
     *
     * @param newSessions List of new/updated Session__c records
     * @param oldSessions List of old Session__c records (null for inserts)
     * @param sessionDatesByDay Map of speaker IDs to their session dates
     * @param existingSessionIdsBySpeaker Map of speaker IDs to session IDs to exclude
     * @param existingSessionsBySpeaker Map of speaker IDs to existing sessions
     */
    private static void validateNoConflicts(
        List<Session__c> newSessions,
        List<Session__c> oldSessions,
        Map<Id, Set<Date>> sessionDatesByDay,
        Map<Id, Set<Id>> existingSessionIdsBySpeaker,
        Map<Id, List<Session__c>> existingSessionsBySpeaker
    ) {
        for (Session__c newSession : newSessions) {
            if (newSession.Speaker__c == null || newSession.Start_Time__c == null) {
                continue;
            }

            Date newSessionDate = Date.valueOf(newSession.Start_Time__c);
            List<Session__c> speakerSessions = existingSessionsBySpeaker.get(newSession.Speaker__c);

            if (speakerSessions == null || speakerSessions.isEmpty()) {
                continue;
            }

            for (Session__c existingSession : speakerSessions) {
                if (shouldSkipExistingSession(newSession, existingSession, existingSessionIdsBySpeaker)) {
                    continue;
                }

                if (isDateConflict(newSessionDate, existingSession)) {
                    newSession.addError('Speaker already has a session scheduled on this day.');
                    break;
                }
            }
        }
    }

    /**
     * Determines if an existing session should be skipped in conflict validation.
     *
     * @param newSession The new Session__c record being validated
     * @param existingSession The existing Session__c record to check against
     * @param existingSessionIdsBySpeaker Map of speaker IDs to session IDs being updated
     * @return Boolean true if the session should be skipped, false otherwise
     */
    private static Boolean shouldSkipExistingSession(
        Session__c newSession,
        Session__c existingSession,
        Map<Id, Set<Id>> existingSessionIdsBySpeaker
    ) {
        Set<Id> sessionIdsToExclude = existingSessionIdsBySpeaker.get(newSession.Speaker__c);
        return sessionIdsToExclude != null && sessionIdsToExclude.contains(existingSession.Id);
    }

    /**
     * Checks if an existing session conflicts with the new session date.
     *
     * @param newSessionDate The date of the new session
     * @param existingSession The existing Session__c record to compare
     * @return Boolean true if there is a date conflict, false otherwise
     */
    private static Boolean isDateConflict(Date newSessionDate, Session__c existingSession) {
        if (existingSession.Start_Time__c == null) {
            return false;
        }

        Date existingSessionDate = Date.valueOf(existingSession.Start_Time__c);
        return newSessionDate.equals(existingSessionDate);
    }
}