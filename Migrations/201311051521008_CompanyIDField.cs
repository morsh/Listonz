namespace Listonz.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class CompanyIDField : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Contacts", "Company_Id", c => c.Int());
            AddForeignKey("dbo.Contacts", "Company_Id", "dbo.Contacts", "Id");
            CreateIndex("dbo.Contacts", "Company_Id");
            DropColumn("dbo.Contacts", "Company");
        }
        
        public override void Down()
        {
            AddColumn("dbo.Contacts", "Company", c => c.String());
            DropIndex("dbo.Contacts", new[] { "Company_Id" });
            DropForeignKey("dbo.Contacts", "Company_Id", "dbo.Contacts");
            DropColumn("dbo.Contacts", "Company_Id");
        }
    }
}
