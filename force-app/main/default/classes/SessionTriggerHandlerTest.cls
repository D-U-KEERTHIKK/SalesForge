/**
 * @description Test class for SessionTriggerHandler.
 *              Covers valid booking, blocked overlap, blocked update overlap,
 *              and allowed same-day non-conflicting update scenarios.
 * @author      AgentForge — DF-4
 */
@IsTest
private class SessionTriggerHandlerTest {

    /**
     * @description Creates a test Speaker__c record for reuse across test methods.
     * @return Inserted Speaker__c record
     */
    private static Speaker__c createTestSpeaker() {
        Speaker__c speaker = new Speaker__c(
            Name__c = 'Test Speaker',
            Company__c = 'Test Company',
            Bio__c = 'Test Bio'
        );
        insert speaker;
        return speaker;
    }

    /**
     * @description Test 1: Successful insert when no overlap exists.
     *              A speaker with no existing sessions on a given day
     *              should be inserted without error.
     */
    @IsTest
    static void testValidNonOverlappingBooking() {
        Speaker__c speaker = createTestSpeaker();

        Session__c session = new Session__c(
            Title__c = 'Morning Keynote',
            Speaker__c = speaker.Id,
            Room__c = 'Hall A',
            Start_Time__c = Datetime.newInstance(2026, 9, 1, 9, 0, 0),
            Capacity__c = 100
        );

        Test.startTest();
        System.runAs(new User(Id = UserInfo.getUserId())) {
            insert session;
        }
        Test.stopTest();

        List<Session__c> inserted = [SELECT Id FROM Session__c WHERE Id = :session.Id];
        System.assertEquals(1, inserted.size(), 'Session should be inserted successfully.');
    }

    /**
     * @description Test 2: Blocked insert when speaker already has a session on the same day.
     *              The trigger should call addError and prevent the duplicate insert.
     */
    @IsTest
    static void testBlockedOverlappingBooking() {
        Speaker__c speaker = createTestSpeaker();

        Session__c existing = new Session__c(
            Title__c = 'Morning Keynote',
            Speaker__c = speaker.Id,
            Room__c = 'Hall A',
            Start_Time__c = Datetime.newInstance(2026, 9, 1, 9, 0, 0),
            Capacity__c = 100
        );
        insert existing;

        Session__c duplicate = new Session__c(
            Title__c = 'Afternoon Talk',
            Speaker__c = speaker.Id,
            Room__c = 'Hall B',
            Start_Time__c = Datetime.newInstance(2026, 9, 1, 14, 0, 0),
            Capacity__c = 50
        );

        Test.startTest();
        System.runAs(new User(Id = UserInfo.getUserId())) {
            try {
                insert duplicate;
                System.assert(false, 'Expected DmlException was not thrown.');
            } catch (DmlException e) {
                System.assert(
                    e.getMessage().contains('already booked'),
                    'Expected double-booking error message. Got: ' + e.getMessage()
                );
            }
        }
        Test.stopTest();
    }

    /**
     * @description Test 3: Blocked update that would create an overlap.
     *              Updating a session to a day where the speaker is already booked
     *              should be rejected by the trigger.
     */
    @IsTest
    static void testBlockedUpdateCreatingOverlap() {
        Speaker__c speaker = createTestSpeaker();

        Session__c session1 = new Session__c(
            Title__c = 'Session One',
            Speaker__c = speaker.Id,
            Room__c = 'Hall A',
            Start_Time__c = Datetime.newInstance(2026, 9, 1, 9, 0, 0),
            Capacity__c = 100
        );
        insert session1;

        Session__c session2 = new Session__c(
            Title__c = 'Session Two',
            Speaker__c = speaker.Id,
            Room__c = 'Hall B',
            Start_Time__c = Datetime.newInstance(2026, 9, 2, 9, 0, 0),
            Capacity__c = 50
        );
        insert session2;

        session2.Start_Time__c = Datetime.newInstance(2026, 9, 1, 14, 0, 0);

        Test.startTest();
        System.runAs(new User(Id = UserInfo.getUserId())) {
            try {
                update session2;
                System.assert(false, 'Expected DmlException was not thrown.');
            } catch (DmlException e) {
                System.assert(
                    e.getMessage().contains('already booked'),
                    'Expected double-booking error on update. Got: ' + e.getMessage()
                );
            }
        }
        Test.stopTest();
    }

    /**
     * @description Test 4: Allowed update that keeps the same day without conflicting.
     *              Updating a non-date field on an existing session should not trigger
     *              a double-booking error.
     */
    @IsTest
    static void testAllowedUpdateSameDayNoConflict() {
        Speaker__c speaker = createTestSpeaker();

        Session__c session = new Session__c(
            Title__c = 'Workshop',
            Speaker__c = speaker.Id,
            Room__c = 'Hall C',
            Start_Time__c = Datetime.newInstance(2026, 9, 3, 10, 0, 0),
            Capacity__c = 30
        );
        insert session;

        session.Room__c = 'Hall D';

        Test.startTest();
        System.runAs(new User(Id = UserInfo.getUserId())) {
            update session;
        }
        Test.stopTest();

        Session__c updated = [SELECT Room__c FROM Session__c WHERE Id = :session.Id];
        System.assertEquals('Hall D', updated.Room__c, 'Room should be updated successfully.');
    }
}
