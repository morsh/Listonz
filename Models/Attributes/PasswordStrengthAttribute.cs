using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Listonz.Models
{
    public class PasswordStrengthAttribute : ValidationAttribute, IClientValidatable
    {
        public int MinimumLength { get; set; }
        public int MaximumLength { get; set; }

        public PasswordStrengthAttribute()
        {
            MinimumLength = 6;
            MaximumLength = 100;
        }
        public PasswordStrengthAttribute(int minimumLength, int maximumLength)
        {
            MinimumLength = minimumLength;
            MaximumLength = maximumLength;
        }

        #region Overrides of ValidationAttribute

        /// <summary>
        /// Determines whether the specified value of the object is valid. 
        /// </summary>
        /// <returns>
        /// true if the specified value is valid; otherwise, false. 
        /// </returns>
        /// <param name="value">The value of the specified validation object on which the <see cref="T:System.ComponentModel.DataAnnotations.ValidationAttribute"/> is declared.
        /// </param>
        public override bool IsValid(object value)
        {
            if (value == null) return false;
            if (value.ToString().Length < MinimumLength || value.ToString().Length > MaximumLength) return false;
            return true;
        }

        #endregion

        public IEnumerable<ModelClientValidationRule> GetClientValidationRules(ModelMetadata metadata, ControllerContext context)
        {
            yield return new ModelClientValidationRule
            {
                ErrorMessage = this.ErrorMessage,
                ValidationType = "passwordstrength"
            };
        }
    }
}