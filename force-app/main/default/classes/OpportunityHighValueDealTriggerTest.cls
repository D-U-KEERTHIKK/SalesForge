/**
 * @description Test class for OpportunityHighValueDealTrigger.
 * Verifies end-to-end trigger behavior: inserting/updating an Opportunity to Closed Won
 * with a high amount fires the Platform Event, while low-value or non-closed Opportunities do not.
 */
@IsTest
public class OpportunityHighValueDealTriggerTest {
  private static final Decimal HIGH_VALUE_THRESHOLD = 100000;
  private static final Decimal HIGH_AMOUNT = 150000;
  private static final Decimal LOW_AMOUNT = 50000;
  private static final String CLOSED_WON_STAGE = 'Closed Won';
  private static final String OPEN_STAGE = 'Prospecting';

  /**
   * @description Test that inserting a Closed Won high-value Opportunity publishes the event.
   */
  @IsTest
  static void testInsertHighValueClosedWonOpportunitypublishesEvent() {
    User testUser = createTestUser();
    System.runAs(testUser) {
      Test.startTest();
      Opportunity opp = new Opportunity(
        Name = 'High Value Deal',
        StageName = CLOSED_WON_STAGE,
        Amount = HIGH_AMOUNT,
        CloseDate = System.today(),
        OwnerId = testUser.Id
      );
      insert opp;
      Test.stopTest();

      List<High_Value_Deal_Closed__e> events = [
        SELECT Id
        FROM High_Value_Deal_Closed__e
      ];
      Assert.areEqual(
        1,
        events.size(),
        'Expected one High_Value_Deal_Closed__e event to be published'
      );
    }
  }

  /**
   * @description Test that inserting a Closed Won low-value Opportunity does not publish the event.
   */
  @IsTest
  static void testInsertLowValueClosedWonOpportunityDoesNotPublishEvent() {
    User testUser = createTestUser();
    System.runAs(testUser) {
      Test.startTest();
      Opportunity opp = new Opportunity(
        Name = 'Low Value Deal',
        StageName = CLOSED_WON_STAGE,
        Amount = LOW_AMOUNT,
        CloseDate = System.today(),
        OwnerId = testUser.Id
      );
      insert opp;
      Test.stopTest();

      List<High_Value_Deal_Closed__e> events = [
        SELECT Id
        FROM High_Value_Deal_Closed__e
      ];
      Assert.areEqual(
        0,
        events.size(),
        'Expected no High_Value_Deal_Closed__e event for low-value opportunity'
      );
    }
  }

  /**
   * @description Test that inserting an open Opportunity does not publish the event.
   */
  @IsTest
  static void testInsertOpenStageOpportunityDoesNotPublishEvent() {
    User testUser = createTestUser();
    System.runAs(testUser) {
      Test.startTest();
      Opportunity opp = new Opportunity(
        Name = 'Open Deal',
        StageName = OPEN_STAGE,
        Amount = HIGH_AMOUNT,
        CloseDate = System.today().addDays(30),
        OwnerId = testUser.Id
      );
      insert opp;
      Test.stopTest();

      List<High_Value_Deal_Closed__e> events = [
        SELECT Id
        FROM High_Value_Deal_Closed__e
      ];
      Assert.areEqual(
        0,
        events.size(),
        'Expected no High_Value_Deal_Closed__e event for open opportunity'
      );
    }
  }

  /**
   * @description Test that updating an Opportunity to Closed Won with high amount publishes the event.
   */
  @IsTest
  static void testUpdateToHighValueClosedWonPublishesEvent() {
    User testUser = createTestUser();
    System.runAs(testUser) {
      Opportunity opp = new Opportunity(
        Name = 'Transitioning Deal',
        StageName = OPEN_STAGE,
        Amount = HIGH_AMOUNT,
        CloseDate = System.today(),
        OwnerId = testUser.Id
      );
      insert opp;

      Test.startTest();
      opp.StageName = CLOSED_WON_STAGE;
      update opp;
      Test.stopTest();

      List<High_Value_Deal_Closed__e> events = [
        SELECT Id, Opportunity_Id__c, Amount__c
        FROM High_Value_Deal_Closed__e
      ];
      Assert.areEqual(
        1,
        events.size(),
        'Expected one High_Value_Deal_Closed__e event when transitioning to Closed Won'
      );
      Assert.areEqual(
        opp.Id,
        events[0].Opportunity_Id__c,
        'Expected event to contain correct Opportunity ID'
      );
      Assert.areEqual(
        HIGH_AMOUNT,
        events[0].Amount__c,
        'Expected event to contain correct Amount'
      );
    }
  }

  /**
   * @description Test that updating an Opportunity stage but remaining below threshold does not publish event.
   */
  @IsTest
  static void testUpdateLowValueToClosedWonDoesNotPublishEvent() {
    User testUser = createTestUser();
    System.runAs(testUser) {
      Opportunity opp = new Opportunity(
        Name = 'Low Value Transitioning Deal',
        StageName = OPEN_STAGE,
        Amount = LOW_AMOUNT,
        CloseDate = System.today(),
        OwnerId = testUser.Id
      );
      insert opp;

      Test.startTest();
      opp.StageName = CLOSED_WON_STAGE;
      update opp;
      Test.stopTest();

      List<High_Value_Deal_Closed__e> events = [
        SELECT Id
        FROM High_Value_Deal_Closed__e
      ];
      Assert.areEqual(
        0,
        events.size(),
        'Expected no High_Value_Deal_Closed__e event for low-value opportunity'
      );
    }
  }

  /**
   * @description Test that inserting multiple high-value Closed Won Opportunities publishes multiple events.
   */
  @IsTest
  static void testInsertMultipleHighValueOpportunitiesPublishMultipleEvents() {
    User testUser = createTestUser();
    System.runAs(testUser) {
      List<Opportunity> opps = new List<Opportunity>();
      for (Integer i = 0; i < 3; i++) {
        opps.add(
          new Opportunity(
            Name = 'High Value Deal ' + i,
            StageName = CLOSED_WON_STAGE,
            Amount = HIGH_AMOUNT + (i * 50000),
            CloseDate = System.today(),
            OwnerId = testUser.Id
          )
        );
      }

      Test.startTest();
      insert opps;
      Test.stopTest();

      List<High_Value_Deal_Closed__e> events = [
        SELECT Id
        FROM High_Value_Deal_Closed__e
      ];
      Assert.areEqual(
        3,
        events.size(),
        'Expected three High_Value_Deal_Closed__e events for three high-value opportunities'
      );
    }
  }

  /**
   * @description Test mixed scenario: inserting both high and low value Opportunities only publishes for high-value.
   */
  @IsTest
  static void testMixedScenarioPublishesOnlyForHighValue() {
    User testUser = createTestUser();
    System.runAs(testUser) {
      List<Opportunity> opps = new List<Opportunity>();
      opps.add(
        new Opportunity(
          Name = 'High Value Deal',
          StageName = CLOSED_WON_STAGE,
          Amount = HIGH_AMOUNT,
          CloseDate = System.today(),
          OwnerId = testUser.Id
        )
      );
      opps.add(
        new Opportunity(
          Name = 'Low Value Deal',
          StageName = CLOSED_WON_STAGE,
          Amount = LOW_AMOUNT,
          CloseDate = System.today(),
          OwnerId = testUser.Id
        )
      );
      opps.add(
        new Opportunity(
          Name = 'Open Deal',
          StageName = OPEN_STAGE,
          Amount = HIGH_AMOUNT,
          CloseDate = System.today().addDays(30),
          OwnerId = testUser.Id
        )
      );

      Test.startTest();
      insert opps;
      Test.stopTest();

      List<High_Value_Deal_Closed__e> events = [
        SELECT Id
        FROM High_Value_Deal_Closed__e
      ];
      Assert.areEqual(
        1,
        events.size(),
        'Expected only one High_Value_Deal_Closed__e event (only for high-value Closed Won opportunity)'
      );
    }
  }

  /**
   * @description Test that updating only the amount does not trigger event if stage is not Closed Won.
   */
  @IsTest
  static void testUpdateAmountWithoutStageChangeDoesNotPublishEvent() {
    User testUser = createTestUser();
    System.runAs(testUser) {
      Opportunity opp = new Opportunity(
        Name = 'Deal',
        StageName = OPEN_STAGE,
        Amount = LOW_AMOUNT,
        CloseDate = System.today().addDays(30),
        OwnerId = testUser.Id
      );
      insert opp;

      Test.startTest();
      opp.Amount = HIGH_AMOUNT;
      update opp;
      Test.stopTest();

      List<High_Value_Deal_Closed__e> events = [
        SELECT Id
        FROM High_Value_Deal_Closed__e
      ];
      Assert.areEqual(
        0,
        events.size(),
        'Expected no event when amount is updated but stage remains open'
      );
    }
  }

  /**
   * @description Helper method to create a test user.
   * @return User A test user with a unique username.
   */
  private static User createTestUser() {
    String uniqueSuffix = String.valueOf(System.now().getTime());
    User testUser = new User(
      FirstName = 'Test',
      LastName = 'User',
      Email = 'testuser' + uniqueSuffix + '@example.com',
      Username = 'testuser' + uniqueSuffix + '@example.com',
      ProfileId = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1]
        .Id,
      Alias = 'tuser',
      CommunityNickname = 'testuser' + uniqueSuffix,
      TimeZoneSidKey = 'America/Los_Angeles',
      LocaleSidKey = 'en_US',
      EmailEncodingKey = 'UTF-8',
      LanguageLocaleKey = 'en_US'
    );
    insert testUser;
    return testUser;
  }
}