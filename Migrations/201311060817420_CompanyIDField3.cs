namespace Listonz.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class CompanyIDField3 : DbMigration
    {
        public override void Up()
        {
            DropForeignKey("dbo.Contacts", "Company_Id", "dbo.Contacts");
            DropIndex("dbo.Contacts", new[] { "Company_Id" });
            DropColumn("dbo.Contacts", "Company_Id");
        }
        
        public override void Down()
        {
            AddColumn("dbo.Contacts", "Company_Id", c => c.Int());
            CreateIndex("dbo.Contacts", "Company_Id");
            AddForeignKey("dbo.Contacts", "Company_Id", "dbo.Contacts", "Id");
        }
    }
}
