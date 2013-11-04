namespace Listonz.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class SocialSecurityRating : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Contacts", "SocialSecurity", c => c.String());
            AddColumn("dbo.Contacts", "Rating", c => c.Int(nullable: false));
            DropColumn("dbo.Contacts", "SocialDecurity");
        }
        
        public override void Down()
        {
            AddColumn("dbo.Contacts", "SocialDecurity", c => c.String());
            DropColumn("dbo.Contacts", "Rating");
            DropColumn("dbo.Contacts", "SocialSecurity");
        }
    }
}
