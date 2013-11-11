namespace Listonz.Migrations
{
    using Listonz.Models;
    using System;
    using System.Data.Entity;
    using System.Data.Entity.Migrations;
    using System.Linq;

    internal sealed class Configuration : DbMigrationsConfiguration<Listonz.Models.UsersContext>
    {
        public Configuration()
        {
            AutomaticMigrationsEnabled = true;
        }

        protected override void Seed(Listonz.Models.UsersContext context)
        {
            //  This method will be called after migrating to the latest version.
            context.Categories.AddOrUpdate(
                c => c.Name,
                new Category { Name = "Artist" },
                new Category { Name = "Company" },
                new Category { Name = "Venue" },
                new Category { Name = "Service Provider" }
                );


            //  You can use the DbSet<T>.AddOrUpdate() helper extension method 
            //  to avoid creating duplicate seed data. E.g.
            //
            //    context.People.AddOrUpdate(
            //      p => p.FullName,
            //      new Person { FullName = "Andrew Peters" },
            //      new Person { FullName = "Brice Lambson" },
            //      new Person { FullName = "Rowan Miller" }
            //    );
            //
        }
    }
}
