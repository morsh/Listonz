namespace Listonz.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class AddContacts_1 : DbMigration
    {
        public override void Up()
        {
            try
            {
                DropTable("dbo.Contacts");
            }
            catch (Exception) { }

            CreateTable(
                "dbo.Contacts",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        FisrtName = c.String(),
                        LastName = c.String(),
                        Company = c.String(),
                        Country = c.String(),
                        State = c.String(),
                        City = c.String(),
                        Street = c.String(),
                        Notes = c.String(),
                        Category = c.String(),
                        Email = c.String(),
                        PhoneNumber = c.String(),
                        MobileNumber = c.String(),
                        FaxNumber = c.String(),
                        Birthday = c.String(),
                        Single = c.Boolean(nullable: true),
                        SocialDecurity = c.String(),
                        DrivingLisence = c.String(),
                        LastUpdate = c.DateTime(nullable: true),
                    })
                .PrimaryKey(t => t.Id);
        }
        
        public override void Down()
        {
            DropTable("dbo.Contacts");
        }
    }
}
