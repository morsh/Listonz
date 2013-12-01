namespace Listonz.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class ContactsSingleString : DbMigration
    {
        public override void Up()
        {
            AlterColumn("dbo.Contacts", "Single", c => c.String());
        }
        
        public override void Down()
        {
            AlterColumn("dbo.Contacts", "Single", c => c.Boolean());
        }
    }
}
