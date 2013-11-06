namespace Listonz.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class CompanyIDField4 : DbMigration
    {
        public override void Up()
        {
            Sql("ALTER TABLE [dbo].[Contacts] ADD [CompanyId] [int] REFERENCES [dbo].[Contacts]");
            //AddColumn("dbo.Contacts", "CompanyId", c => c.Int(nullable: false));
            //AddForeignKey("dbo.Contacts", "CompanyId", "dbo.Contacts", "Id");
            //CreateIndex("dbo.Contacts", "CompanyId");
        }
        
        public override void Down()
        {
            DropColumn("dbo.Contacts", "CompanyId");
        }
    }
}
