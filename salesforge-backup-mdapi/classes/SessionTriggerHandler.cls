/**
 * @description Handles trigger logic for the Session__c custom object.
 *              Prevents double-booking of speakers on the same calendar day.
 * @author      AgentForge — DF-4
 */
public with sharing class SessionTriggerHandler {

    /**
     * @description Validates that a speaker is not already booked for another
     *              session on the same calendar day. Adds a field error to any
     *              record that would create a duplicate booking.
     * @param newRecords List of incoming Session__c records (insert or update)
     * @param oldMap     Map of previous Session__c records by Id (null on insert)
     */
    public static void preventDoubleBooking(
        List<Session__c> newRecords,
        Map<Id, Session__c> oldMap
    ) {
        if (newRecords == null || newRecords.isEmpty()) {
            return;
        }

        Set<Id> speakerIds = new Set<Id>();
        Set<Id> currentIds = new Set<Id>();

        for (Session__c record : newRecords) {
            if (record.Speaker__c != null) {
                speakerIds.add(record.Speaker__c);
            }
            if (record.Id != null) {
                currentIds.add(record.Id);
            }
        }

        if (speakerIds.isEmpty()) {
            return;
        }

        List<Session__c> existingSessions = [
            SELECT Id, Speaker__c, Start_Time__c
            FROM Session__c
            WHERE Speaker__c IN :speakerIds
            AND Id NOT IN :currentIds
        ];

        Set<String> bookedKeys = extractBookedKeys(existingSessions);

        for (Session__c record : newRecords) {
            if (record.Speaker__c == null || record.Start_Time__c == null) {
                continue;
            }
            String dateKey = buildDateKey(record.Speaker__c, record.Start_Time__c);
            if (bookedKeys.contains(dateKey)) {
                record.addError('This speaker is already booked for another session on this date.');
            }
        }
    }

    /**
     * @description Extracts composite booking keys from existing sessions.
     * @param existingSessions Existing Session__c records to extract keys from
     * @return Set of speakerId::date composite key strings
     */
    private static Set<String> extractBookedKeys(List<Session__c> existingSessions) {
        Set<String> bookedKeys = new Set<String>();
        for (Session__c s : existingSessions) {
            if (s.Speaker__c != null && s.Start_Time__c != null) {
                bookedKeys.add(buildDateKey(s.Speaker__c, s.Start_Time__c));
            }
        }
        return bookedKeys;
    }

    /**
     * @description Builds a composite key from speaker ID and Datetime value.
     * @param speakerId The Speaker__c lookup field ID
     * @param startTime The Start_Time__c Datetime value
     * @return Composite key string in format: speakerId::YYYY-MM-DD
     */
    private static String buildDateKey(Id speakerId, Datetime startTime) {
        return speakerId + '::' + startTime.format('yyyy-MM-dd');
    }
}