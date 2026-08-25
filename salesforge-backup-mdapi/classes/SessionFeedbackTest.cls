@isTest
private class SessionFeedbackTest {

    @isTest
    static void testValidRating() {
        Session_Feedback__c feedback = new Session_Feedback__c(
            Session_Name__c = 'Test Session',
            Rating__c = 3,
            Comments__c = 'Good session'
        );
        
        insert feedback;
        

        Session_Feedback__c result = [SELECT Id, Rating__c FROM Session_Feedback__c WHERE Id = :feedback.Id];
        System.assertNotEquals(null, result.Id, 'Record should have been saved successfully');
        System.assertEquals(3, result.Rating__c, 'Rating should be 3');
    }

    @isTest
    static void testInvalidRatingTooLow() {
        Session_Feedback__c feedback = new Session_Feedback__c(
            Session_Name__c = 'Test Session',
            Rating__c = 0,
            Comments__c = 'Too low'
        );
        
        try {
            insert feedback;
            System.assert(false, 'Expected DmlException for Rating__c = 0');
        } catch (DmlException e) {
            System.assert(
                e.getMessage().contains('Rating_Between_1_And_5') || e.getDmlType(0) == StatusCode.FIELD_CUSTOM_VALIDATION_EXCEPTION,
                'Expected validation rule exception for rating < 1'
            );
        }
        
    }

    @isTest
    static void testInvalidRatingTooHigh() {
        Session_Feedback__c feedback = new Session_Feedback__c(
            Session_Name__c = 'Test Session',
            Rating__c = 6,
            Comments__c = 'Too high'
        );
        
        try {
            insert feedback;
            System.assert(false, 'Expected DmlException for Rating__c = 6');
        } catch (DmlException e) {
            System.assert(
                e.getMessage().contains('Rating_Between_1_And_5') || e.getDmlType(0) == StatusCode.FIELD_CUSTOM_VALIDATION_EXCEPTION,
                'Expected validation rule exception for rating > 5'
            );
        }
        
    }

    @isTest
    static void testBlankCommentsAllowed() {
        Session_Feedback__c feedback = new Session_Feedback__c(
            Session_Name__c = 'Test Session',
            Rating__c = 5,
            Comments__c = null
        );

        insert feedback;

        Session_Feedback__c result = [SELECT Id FROM Session_Feedback__c WHERE Id = :feedback.Id];
        System.assertNotEquals(null, result.Id, 'Record with blank comments should be saved successfully');
    }
}