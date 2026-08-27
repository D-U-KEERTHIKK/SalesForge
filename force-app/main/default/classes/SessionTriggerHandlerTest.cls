/**
 * @description Test coverage for SessionTriggerHandler (DF-4 logic) and DF-5 requirements.
 *              Covers: non-overlapping bookings, overlap blocking, different speakers,
 *              null speaker skip, and null start time skip.
 * @ticket      DF-5
 */
@IsTest(SeeAllData=false)
private class SessionTriggerHandlerTest {

    // ─── Helpers ────────────────────────────────────────────────────────────

    private static Speaker__c createSpeaker(String name) {
        Speaker__c spk = new Speaker__c(Name = name);
        insert spk;
        return spk;
    }

    private static Session__c buildSession(Id speakerId, Datetime startTime, String title) {
        return new Session__c(
            Name          = title,
            Title__c      = title,
            Speaker__c    = speakerId,
            Start_Time__c = startTime,
            Room__c       = 'Room A',
            Capacity__c   = 50
        );
    }

    // ─── Test 1: Same speaker, different dates → both succeed ───────────────

    @IsTest
    static void testNonOverlappingBookingsAccepted() {
        System.runAs(new User(Id = UserInfo.getUserId())) {
            Speaker__c spk = createSpeaker('Speaker One');

            Session__c s1 = buildSession(spk.Id, Datetime.newInstance(2025, 10, 1, 9, 0, 0), 'Session A');
            insert s1;

            Session__c s2 = buildSession(spk.Id, Datetime.newInstance(2025, 10, 2, 9, 0, 0), 'Session B');

            Test.startTest();
            Database.SaveResult result = Database.insert(s2, false);
            Test.stopTest();

            System.assert(result.isSuccess(), 'Non-overlapping booking on a different date should succeed.');
        }
    }

    // ─── Test 2: Same speaker, same date → second insert is blocked ─────────

    @IsTest
    static void testOverlappingBookingBlocked() {
        System.runAs(new User(Id = UserInfo.getUserId())) {
            Speaker__c spk = createSpeaker('Speaker Two');

            Session__c s1 = buildSession(spk.Id, Datetime.newInstance(2025, 11, 5, 9, 0, 0), 'Morning Session');
            insert s1;

            Session__c s2 = buildSession(spk.Id, Datetime.newInstance(2025, 11, 5, 14, 0, 0), 'Afternoon Session');

            Test.startTest();
            Database.SaveResult result = Database.insert(s2, false);
            Test.stopTest();

            System.assert(!result.isSuccess(), 'Overlapping booking for same speaker on same date should fail.');
            System.assert(
                result.getErrors()[0].getMessage().contains('already booked'),
                'Error message should mention double-booking. Got: ' + result.getErrors()[0].getMessage()
            );
        }
    }

    // ─── Test 3: Different speakers, same date → both succeed ───────────────

    @IsTest
    static void testDifferentSpeakersSameDateAllowed() {
        System.runAs(new User(Id = UserInfo.getUserId())) {
            Speaker__c spk1 = createSpeaker('Speaker Three');
            Speaker__c spk2 = createSpeaker('Speaker Four');

            Session__c s1 = buildSession(spk1.Id, Datetime.newInstance(2025, 12, 1, 10, 0, 0), 'Keynote');
            insert s1;

            Session__c s2 = buildSession(spk2.Id, Datetime.newInstance(2025, 12, 1, 10, 0, 0), 'Workshop');

            Test.startTest();
            Database.SaveResult result = Database.insert(s2, false);
            Test.stopTest();

            System.assert(result.isSuccess(), 'Different speakers on the same date should both be allowed.');
        }
    }

    // ─── Test 4: Null speaker → no error ────────────────────────────────────

    @IsTest
    static void testNullSpeakerSkipped() {
        System.runAs(new User(Id = UserInfo.getUserId())) {
            Session__c s = new Session__c(
                Name          = 'No Speaker Session',
                Title__c      = 'No Speaker Session',
                Speaker__c    = null,
                Start_Time__c = Datetime.newInstance(2025, 9, 15, 9, 0, 0),
                Room__c       = 'Room B',
                Capacity__c   = 30
            );

            Test.startTest();
            Database.SaveResult result = Database.insert(s, false);
            Test.stopTest();

            System.assert(result.isSuccess(), 'Session with null Speaker__c should insert without error.');
        }
    }

    // ─── Test 5: Null start time → no error ─────────────────────────────────

    @IsTest
    static void testNullStartTimeSkipped() {
        System.runAs(new User(Id = UserInfo.getUserId())) {
            Speaker__c spk = createSpeaker('Speaker Five');

            Session__c s = new Session__c(
                Name          = 'No Time Session',
                Title__c      = 'No Time Session',
                Speaker__c    = spk.Id,
                Start_Time__c = null,
                Room__c       = 'Room C',
                Capacity__c   = 20
            );

            Test.startTest();
            Database.SaveResult result = Database.insert(s, false);
            Test.stopTest();

            System.assert(result.isSuccess(), 'Session with null Start_Time__c should insert without error.');
        }
    }
}