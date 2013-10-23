namespace Listonz.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class UpdateContactsFirstName : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Contacts", "FirstName", c => c.String());
            DropColumn("dbo.Contacts", "FisrtName");
        }
        
        public override void Down()
        {
            AddColumn("dbo.Contacts", "FisrtName", c => c.String());
            DropColumn("dbo.Contacts", "FirstName");
        }
    }
}
