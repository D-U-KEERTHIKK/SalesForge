/**
 * @description Test class for OpportunityHighValueDealEventPublisher.
 * Verifies that the Platform Event is published correctly when high-value Opportunities close,
 * and that low-value or non-closed Opportunities do not trigger events.
 */
@IsTest
private class OpportunityHighValueDealEventPublisherTest {

  private static final Decimal HIGH_VALUE_THRESHOLD = 100000;
  private static final String CLOSED_WON_STAGE = 'Closed Won';
  private static final String OPEN_STAGE = 'Prospecting';

  /**
   * @description Create a test user with standard permissions.
   */
  private static User createTestUser() {
    Profile stdUserProfile = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
    User testUser = new User(
      FirstName = 'Test',
      LastName = 'User',
      Email = 'testuser@example.com',
      Username = 'testuser' + System.now().getTime() + '@example.com',
      ProfileId = stdUserProfile.Id,
      Alias = 'tuser',
      TimeZoneSidKey = 'America/New_York',
      LocaleSidKey = 'en_US',
      EmailEncodingKey = 'UTF-8',
      LanguageLocaleKey = 'en_US'
    );
    insert testUser;
    return testUser;
  }

  /**
   * @description Test that a high-value, Closed Won Opportunity publishes the event correctly.
   */
  @IsTest
  private static void testPublishHighValueDealEvents_ClosedWonHighValue() {
    User testUser = createTestUser();

    System.runAs(testUser) {
      // Arrange
      Account testAccount = new Account(Name = 'Test Account');
      insert testAccount;

      Opportunity closedWonOpportunity = new Opportunity(
        Name = 'High Value Deal',
        AccountId = testAccount.Id,
        StageName = CLOSED_WON_STAGE,
        Amount = HIGH_VALUE_THRESHOLD + 50000,
        CloseDate = System.today()
      );
      insert closedWonOpportunity;

      List<Opportunity> opportunities = new List<Opportunity>{ closedWonOpportunity };

      // Act
      Test.getEventBus().deliver();
      OpportunityHighValueDealEventPublisher.publishHighValueDealEvents(opportunities);
      Test.getEventBus().deliver();

      // Assert
      List<High_Value_Deal_Closed__e> publishedEvents = [
        SELECT Id, Opportunity_Id__c, Opportunity_Name__c, Amount__c, Owner_Id__c, Close_Date__c
        FROM High_Value_Deal_Closed__e
      ];

      Assert.areEqual(1, publishedEvents.size(), 'Expected one Platform Event to be published');
      Assert.areEqual(
        closedWonOpportunity.Id,
        publishedEvents[0].Opportunity_Id__c,
        'Opportunity ID should match event field'
      );
      Assert.areEqual(
        closedWonOpportunity.Name,
        publishedEvents[0].Opportunity_Name__c,
        'Opportunity Name should match event field'
      );
      Assert.areEqual(
        closedWonOpportunity.Amount,
        publishedEvents[0].Amount__c,
        'Amount should match event field'
      );
      Assert.areEqual(
        closedWonOpportunity.OwnerId,
        publishedEvents[0].Owner_Id__c,
        'Owner ID should match event field'
      );
      Assert.areEqual(
        closedWonOpportunity.CloseDate,
        publishedEvents[0].Close_Date__c,
        'Close Date should match event field'
      );
    }
  }

  /**
   * @description Test that low-value Closed Won Opportunities do not publish events.
   */
  @IsTest
  private static void testPublishHighValueDealEvents_ClosedWonLowValue() {
    User testUser = createTestUser();

    System.runAs(testUser) {
      // Arrange
      Account testAccount = new Account(Name = 'Test Account');
      insert testAccount;

      Opportunity lowValueOpportunity = new Opportunity(
        Name = 'Low Value Deal',
        AccountId = testAccount.Id,
        StageName = CLOSED_WON_STAGE,
        Amount = HIGH_VALUE_THRESHOLD - 50000,
        CloseDate = System.today()
      );
      insert lowValueOpportunity;

      List<Opportunity> opportunities = new List<Opportunity>{ lowValueOpportunity };

      // Act
      Test.getEventBus().deliver();
      OpportunityHighValueDealEventPublisher.publishHighValueDealEvents(opportunities);
      Test.getEventBus().deliver();

      // Assert
      List<High_Value_Deal_Closed__e> publishedEvents = [
        SELECT Id
        FROM High_Value_Deal_Closed__e
      ];

      Assert.areEqual(0, publishedEvents.size(), 'Expected no Platform Event for low-value Opportunity');
    }
  }

  /**
   * @description Test that non-Closed Won Opportunities do not publish events.
   */
  @IsTest
  private static void testPublishHighValueDealEvents_OpenStageHighValue() {
    User testUser = createTestUser();

    System.runAs(testUser) {
      // Arrange
      Account testAccount = new Account(Name = 'Test Account');
      insert testAccount;

      Opportunity openOpportunity = new Opportunity(
        Name = 'Open High Value Deal',
        AccountId = testAccount.Id,
        StageName = OPEN_STAGE,
        Amount = HIGH_VALUE_THRESHOLD + 50000,
        CloseDate = System.today().addDays(30)
      );
      insert openOpportunity;

      List<Opportunity> opportunities = new List<Opportunity>{ openOpportunity };

      // Act
      Test.getEventBus().deliver();
      OpportunityHighValueDealEventPublisher.publishHighValueDealEvents(opportunities);
      Test.getEventBus().deliver();

      // Assert
      List<High_Value_Deal_Closed__e> publishedEvents = [
        SELECT Id
        FROM High_Value_Deal_Closed__e
      ];

      Assert.areEqual(
        0,
        publishedEvents.size(),
        'Expected no Platform Event for non-Closed Won Opportunity'
      );
    }
  }

  /**
   * @description Test that multiple high-value Closed Won Opportunities publish multiple events.
   */
  @IsTest
  private static void testPublishHighValueDealEvents_MultipleHighValueDeals() {
    User testUser = createTestUser();

    System.runAs(testUser) {
      // Arrange
      Account testAccount = new Account(Name = 'Test Account');
      insert testAccount;

      Opportunity opportunity1 = new Opportunity(
        Name = 'High Value Deal 1',
        AccountId = testAccount.Id,
        StageName = CLOSED_WON_STAGE,
        Amount = HIGH_VALUE_THRESHOLD + 25000,
        CloseDate = System.today()
      );

      Opportunity opportunity2 = new Opportunity(
        Name = 'High Value Deal 2',
        AccountId = testAccount.Id,
        StageName = CLOSED_WON_STAGE,
        Amount = HIGH_VALUE_THRESHOLD + 75000,
        CloseDate = System.today()
      );

      List<Opportunity> opportunities = new List<Opportunity>{ opportunity1, opportunity2 };
      insert opportunities;

      // Act
      Test.getEventBus().deliver();
      OpportunityHighValueDealEventPublisher.publishHighValueDealEvents(opportunities);
      Test.getEventBus().deliver();

      // Assert
      List<High_Value_Deal_Closed__e> publishedEvents = [
        SELECT Id, Opportunity_Id__c
        FROM High_Value_Deal_Closed__e
        ORDER BY Opportunity_Id__c
      ];

      Assert.areEqual(2, publishedEvents.size(), 'Expected two Platform Events to be published');
    }
  }

  /**
   * @description Test with mixed list of high-value, low-value, and non-closed Opportunities.
   */
  @IsTest
  private static void testPublishHighValueDealEvents_MixedScenarios() {
    User testUser = createTestUser();

    System.runAs(testUser) {
      // Arrange
      Account testAccount = new Account(Name = 'Test Account');
      insert testAccount;

      Opportunity highValueClosed = new Opportunity(
        Name = 'High Value Closed',
        AccountId = testAccount.Id,
        StageName = CLOSED_WON_STAGE,
        Amount = HIGH_VALUE_THRESHOLD + 100000,
        CloseDate = System.today()
      );

      Opportunity lowValueClosed = new Opportunity(
        Name = 'Low Value Closed',
        AccountId = testAccount.Id,
        StageName = CLOSED_WON_STAGE,
        Amount = 50000,
        CloseDate = System.today()
      );

      Opportunity highValueOpen = new Opportunity(
        Name = 'High Value Open',
        AccountId = testAccount.Id,
        StageName = OPEN_STAGE,
        Amount = HIGH_VALUE_THRESHOLD + 50000,
        CloseDate = System.today().addDays(60)
      );

      List<Opportunity> opportunities = new List<Opportunity>{ 
        highValueClosed, 
        lowValueClosed, 
        highValueOpen 
      };
      insert opportunities;

      // Act
      Test.getEventBus().deliver();
      OpportunityHighValueDealEventPublisher.publishHighValueDealEvents(opportunities);
      Test.getEventBus().deliver();

      // Assert
      List<High_Value_Deal_Closed__e> publishedEvents = [
        SELECT Id, Opportunity_Id__c
        FROM High_Value_Deal_Closed__e
      ];

      Assert.areEqual(
        1,
        publishedEvents.size(),
        'Expected only one Platform Event (high-value Closed Won)'
      );
      Assert.areEqual(
        highValueClosed.Id,
        publishedEvents[0].Opportunity_Id__c,
        'Event should be for the high-value closed Opportunity'
      );
    }
  }

  /**
   * @description Test with empty Opportunity list.
   */
  @IsTest
  private static void testPublishHighValueDealEvents_EmptyList() {
    User testUser = createTestUser();

    System.runAs(testUser) {
      // Arrange
      List<Opportunity> opportunities = new List<Opportunity>();

      // Act
      Test.getEventBus().deliver();
      OpportunityHighValueDealEventPublisher.publishHighValueDealEvents(opportunities);
      Test.getEventBus().deliver();

      // Assert
      List<High_Value_Deal_Closed__e> publishedEvents = [
        SELECT Id
        FROM High_Value_Deal_Closed__e
      ];

      Assert.areEqual(0, publishedEvents.size(), 'Expected no Platform Events for empty list');
    }
  }
}