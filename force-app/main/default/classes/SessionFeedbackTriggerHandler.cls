public with sharing class SessionFeedbackTriggerHandler {

    public static void checkOverbooking(List<Session_Feedback__c> feedbackRecords) {
        if (feedbackRecords == null || feedbackRecords.isEmpty()) {
            return;
        }

        // Collect distinct Session Name values from feedback records
        Set<String> sessionNames = new Set<String>();
        for (Session_Feedback__c fb : feedbackRecords) {
            if (fb.Session_Name__c != null) {
                sessionNames.add(fb.Session_Name__c);
            }
        }

        if (sessionNames.isEmpty()) {
            return;
        }

        // Query Session__c records matching those names with Capacity__c
        Map<String, Session__c> sessionsByName = new Map<String, Session__c>();
        for (Session__c s : [
            SELECT Id, Name, Capacity__c, Overbooked__c
            FROM Session__c
            WHERE Name IN :sessionNames
        ]) {
            sessionsByName.put(s.Name, s);
        }

        if (sessionsByName.isEmpty()) {
            return;
        }

        // Count existing Session_Feedback__c records per session name
        Map<String, Integer> feedbackCountMap = new Map<String, Integer>();
        for (AggregateResult ar : [
            SELECT Session_Name__c sessionName, COUNT(Id) feedbackCount
            FROM Session_Feedback__c
            WHERE Session_Name__c IN :sessionNames
            GROUP BY Session_Name__c
        ]) {
            feedbackCountMap.put(
                (String) ar.get('sessionName'),
                (Integer) ar.get('feedbackCount')
            );
        }

        // Evaluate and set Overbooked__c flag
        List<Session__c> sessionsToUpdate = new List<Session__c>();
        for (String sessionName : sessionsByName.keySet()) {
            Session__c session = sessionsByName.get(sessionName);
            Integer capacity = session.Capacity__c != null
                ? (Integer) session.Capacity__c
                : 0;
            Integer feedbackCount = feedbackCountMap.containsKey(sessionName)
                ? feedbackCountMap.get(sessionName)
                : 0;

            Boolean shouldBeOverbooked = feedbackCount > capacity;
            if (session.Overbooked__c != shouldBeOverbooked) {
                sessionsToUpdate.add(new Session__c(
                    Id = session.Id,
                    Overbooked__c = shouldBeOverbooked
                ));
            }
        }

        if (!sessionsToUpdate.isEmpty()) {
            // FLS check before update
            if (Schema.sObjectType.Session__c.isUpdateable()
                && Schema.sObjectType.Session__c.fields.Overbooked__c.isUpdateable()) {
                update sessionsToUpdate;
            }
        }
    }
}
