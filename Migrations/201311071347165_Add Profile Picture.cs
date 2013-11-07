namespace Listonz.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddProfilePicture : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Contacts", "ProfilePicture", c => c.String());
        }
        
        public override void Down()
        {
            DropColumn("dbo.Contacts", "ProfilePicture");
        }
    }
}
