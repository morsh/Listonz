namespace Listonz.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class SocialColumn : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Contacts", "SocialData", c => c.String());
        }
        
        public override void Down()
        {
            DropColumn("dbo.Contacts", "SocialData");
        }
    }
}
