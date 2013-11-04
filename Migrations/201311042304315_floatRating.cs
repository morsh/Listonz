namespace Listonz.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class floatRating : DbMigration
    {
        public override void Up()
        {
            DropColumn("dbo.Contacts", "Rating");
            AddColumn("dbo.Contacts", "Rating", c => c.Double(nullable: true));
        }
        
        public override void Down()
        {
            DropColumn("dbo.Contacts", "Rating");
            AddColumn("dbo.Contacts", "Rating", c => c.Int(nullable: false));
        }
    }
}
