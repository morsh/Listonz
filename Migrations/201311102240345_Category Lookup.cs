namespace Listonz.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class CategoryLookup : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Contacts", "CategoryId", c => c.Int());
            AddForeignKey("dbo.Contacts", "CategoryId", "dbo.Categories", "Id");
            CreateIndex("dbo.Contacts", "CategoryId");
            DropColumn("dbo.Contacts", "Category");
        }
        
        public override void Down()
        {
            AddColumn("dbo.Contacts", "Category", c => c.String());
            DropIndex("dbo.Contacts", new[] { "CategoryId" });
            DropForeignKey("dbo.Contacts", "CategoryId", "dbo.Categories");
            DropColumn("dbo.Contacts", "CategoryId");
        }
    }
}
