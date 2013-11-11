namespace Listonz.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddUserID : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Contacts", "UserId", c => c.Int());
            AddColumn("dbo.Categories", "UserId", c => c.Int());
            AddForeignKey("dbo.Contacts", "UserId", "dbo.UserProfile", "UserId");
            AddForeignKey("dbo.Categories", "UserId", "dbo.UserProfile", "UserId");
            CreateIndex("dbo.Contacts", "UserId");
            CreateIndex("dbo.Categories", "UserId");
        }
        
        public override void Down()
        {
            DropIndex("dbo.Categories", new[] { "UserId" });
            DropIndex("dbo.Contacts", new[] { "UserId" });
            DropForeignKey("dbo.Categories", "UserId", "dbo.UserProfile");
            DropForeignKey("dbo.Contacts", "UserId", "dbo.UserProfile");
            DropColumn("dbo.Categories", "UserId");
            DropColumn("dbo.Contacts", "UserId");
        }
    }
}
