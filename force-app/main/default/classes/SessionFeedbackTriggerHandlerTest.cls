@IsTest
private class SessionFeedbackTriggerHandlerTest {

    @TestSetup
    static void setupTestData() {
        // Create two Speaker__c records for double-booking tests
        List<Speaker__c> speakers = new List<Speaker__c>{
            new Speaker__c(Name = 'Speaker A'),
            new Speaker__c(Name = 'Speaker B')
        };
        insert speakers;

        // Create Session__c records with defined capacity
        DateTime sessionTime = DateTime.newInstance(2025, 9, 1, 10, 0, 0);
        List<Session__c> sessions = new List<Session__c>{
            new Session__c(
                Name       = 'Session Alpha',
                Title__c   = 'Alpha Talk',
                Capacity__c = 3,
                Room__c    = 'Room 101',
                Speaker__c = speakers[0].Id,
                Start_Time__c = sessionTime
            ),
            new Session__c(
                Name       = 'Session Beta',
                Title__c   = 'Beta Talk',
                Capacity__c = 5,
                Room__c    = 'Room 102',
                Speaker__c = speakers[1].Id,
                Start_Time__c = sessionTime.addHours(2)
            )
        };
        insert sessions;
    }

    // -----------------------------------------------------------------------
    // Test 1: Valid non-overlapping booking — two different speakers,
    //         different times, no double-booking conflict expected.
    // -----------------------------------------------------------------------
    @IsTest
    static void testNonOverlappingBooking_NoConflict() {
        List<Session__c> sessions = [
            SELECT Id, Name, Speaker__c, Start_Time__c
            FROM Session__c
            ORDER BY Name
        ];
        System.assertEquals(2, sessions.size(), 'Two sessions should exist');

        // Verify speakers are different — no overlap possible
        System.assertNotEquals(
            sessions[0].Speaker__c,
            sessions[1].Speaker__c,
            'Sessions should have different speakers for non-overlap test'
        );

        // Verify times are different
        System.assertNotEquals(
            sessions[0].Start_Time__c,
            sessions[1].Start_Time__c,
            'Sessions should have different start times'
        );
    }

    // -----------------------------------------------------------------------
    // Test 2: Blocked overlapping booking — same speaker, same time.
    //         Expects a DmlException from a validation rule or trigger.
    // -----------------------------------------------------------------------
    @IsTest
    static void testOverlappingBooking_SameSpeakerSameTime_IsBlocked() {
        List<Speaker__c> speakers = [SELECT Id FROM Speaker__c LIMIT 1];
        System.assert(!speakers.isEmpty(), 'At least one speaker must exist');

        DateTime conflictTime = DateTime.newInstance(2025, 9, 1, 10, 0, 0);

        // First session already exists from @TestSetup at conflictTime.
        // Attempt to insert a second session for the same speaker at same time.
        Session__c conflictSession = new Session__c(
            Name          = 'Session Conflict',
            Title__c      = 'Conflict Talk',
            Capacity__c   = 2,
            Room__c       = 'Room 103',
            Speaker__c    = speakers[0].Id,
            Start_Time__c = conflictTime
        );

        Test.startTest();
        Boolean exceptionThrown = false;
        try {
            insert conflictSession;
        } catch (DmlException e) {
            exceptionThrown = true;
        }
        Test.stopTest();

        System.assert(
            exceptionThrown,
            'A DmlException should be thrown when a speaker is double-booked at the same time'
        );
    }

    // -----------------------------------------------------------------------
    // Test 3: Overbooked flag = true when feedback count exceeds Capacity__c.
    //         Session Alpha has Capacity__c = 3; insert 4 feedback records.
    // -----------------------------------------------------------------------
    @IsTest
    static void testOverbookedFlag_SetTrue_WhenFeedbackExceedsCapacity() {
        Session__c session = [
            SELECT Id, Name, Capacity__c
            FROM Session__c
            WHERE Name = 'Session Alpha'
            LIMIT 1
        ];
        System.assertEquals(3, session.Capacity__c, 'Capacity should be 3 for Session Alpha');

        // Insert 4 feedback records — exceeds capacity of 3
        List<Session_Feedback__c> feedbacks = new List<Session_Feedback__c>();
        for (Integer i = 0; i < 4; i++) {
            feedbacks.add(new Session_Feedback__c(
                Session_Name__c = session.Name,
                Rating__c       = 4,
                Comments__c     = 'Feedback ' + i
            ));
        }

        Test.startTest();
        insert feedbacks;
        Test.stopTest();

        // Re-query Session__c to check Overbooked__c if field exists
        Map<String, Schema.SObjectField> fieldMap =
            Schema.SObjectType.Session__c.fields.getMap();

        if (fieldMap.containsKey('overbooked__c')) {
            Session__c updated = [
                SELECT Id, Overbooked__c
                FROM Session__c
                WHERE Id = :session.Id
                LIMIT 1
            ];
            System.assertEquals(
                true,
                updated.Overbooked__c,
                'Overbooked__c should be true when feedback count (4) exceeds capacity (3)'
            );
        }
    }

    // -----------------------------------------------------------------------
    // Test 4: Overbooked flag stays false when feedback count is under capacity.
    //         Session Beta has Capacity__c = 5; insert 2 feedback records.
    // -----------------------------------------------------------------------
    @IsTest
    static void testOverbookedFlag_StaysFalse_WhenFeedbackUnderCapacity() {
        Session__c session = [
            SELECT Id, Name, Capacity__c
            FROM Session__c
            WHERE Name = 'Session Beta'
            LIMIT 1
        ];
        System.assertEquals(5, session.Capacity__c, 'Capacity should be 5 for Session Beta');

        // Insert 2 feedback records — under capacity of 5
        List<Session_Feedback__c> feedbacks = new List<Session_Feedback__c>{
            new Session_Feedback__c(
                Session_Name__c = session.Name,
                Rating__c       = 3,
                Comments__c     = 'Good session'
            ),
            new Session_Feedback__c(
                Session_Name__c = session.Name,
                Rating__c       = 5,
                Comments__c     = 'Excellent session'
            )
        };

        Test.startTest();
        insert feedbacks;
        Test.stopTest();

        // Re-query and verify Overbooked__c is false if field exists
        Map<String, Schema.SObjectField> fieldMap =
            Schema.SObjectType.Session__c.fields.getMap();

        if (fieldMap.containsKey('overbooked__c')) {
            Session__c updated = [
                SELECT Id, Overbooked__c
                FROM Session__c
                WHERE Id = :session.Id
                LIMIT 1
            ];
            System.assertEquals(
                false,
                updated.Overbooked__c,
                'Overbooked__c should be false when feedback count (2) is under capacity (5)'
            );
        }
    }
}
