public class AccountHandler {  

    // Method to handle Account insertion logic DT-1636
    public static void handleInsert(List<Account> newAccounts) {
        for (Account acc : newAccounts) {
            // Set the custom status to "Active" for new Accounts
            acc.Custom_Account_Status__c = 'Active'; 
            acc.Account_Type__c = 'Prospect'; 
        }
    }

    // Method to handle Account update logic
    public static void handleUpdate(List<Account> newAccounts, List<Account> oldAccounts) {
        for (Integer i = 0; i < newAccounts.size(); i++) {
            Account newAcc = newAccounts[i];
            Account oldAcc = oldAccounts[i];
            
            // If Account name or key fields are being updated, set the status to "Updated"
            if (newAcc.Name != oldAcc.Name || 
                newAcc.ParentId != oldAcc.ParentId || 
                newAcc.Industry != oldAcc.Industry) {
                newAcc.Custom_Account_Status__c = 'Updated'; 
                newAcc.Account_Type__c = 'Customer';
            }  
        }
    }
 
}