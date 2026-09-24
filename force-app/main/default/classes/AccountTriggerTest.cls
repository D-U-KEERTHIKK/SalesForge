@IsTest 
private class AccountTriggerTest { 
 
    @IsTest
    static void testAccountInsert() {   
        // Create a test user for proper permission context
        User testUser = new User(
            FirstName = 'Test',
            LastName = 'User',
            Email = 'testuser@example.com',
            Username = 'testuser@example.com.test',
            ProfileId = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1].Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US'
        );
        insert testUser;

        System.runAs(testUser) {
            // Create a new Account record  
            //  3rd Dec Demo
            Account testAccount = new Account(Name = 'Test Account');
            insert testAccount; 
            
            // Query to ensure the Custom_Account_Status__c field is set correctly
            Account insertedAccount = [SELECT Custom_Account_Status__c FROM Account WHERE Id = :testAccount.Id];
            System.assertEquals('Active', insertedAccount.Custom_Account_Status__c);
        }
    }
 
    @IsTest
    static void testAccountUpdate() {
        // Create a test user for proper permission context
        User testUser = new User(
            FirstName = 'Test',
            LastName = 'User',
            Email = 'testuserupdate@example.com',
            Username = 'testuserupdate@example.com.test',
            ProfileId = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1].Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US'
        );
        insert testUser;

        System.runAs(testUser) {
            // Create and insert a new Account record
            Account testAccount = new Account(Name = 'Test Account');
            insert testAccount;

            // Update the Account's Name
            // 3rd Dec Demo
            testAccount.Name = 'Updated Account';
            update testAccount; 
            
            // Query to ensure the Custom_Account_Status__c field is set correctly after update
            Account updatedAccount = [SELECT Custom_Account_Status__c FROM Account WHERE Id = :testAccount.Id];
            System.assertEquals('Updated', updatedAccount.Custom_Account_Status__c);
        }
    }
}