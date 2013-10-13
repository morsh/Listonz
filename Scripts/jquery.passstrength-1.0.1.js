(function ($) {

    var password_Strength = new function () {

        //return count that match the regular expression
        this.countRegExp = function (passwordVal, regx) {
            var match = passwordVal.match(regx);
            return match ? match.length : 0;
        }

        this.getStrengthInfo = function (passwordVal) {
            var len = passwordVal.length;
            var pStrength = 0; //password strength
            var msg = "", inValidChars = ""; //message

            //get special characters from xml file
            var allowableSpecilaChars = new RegExp("[" + password_settings.specialChars + "]", "g")

            var nums = this.countRegExp(passwordVal, /\d/g), //numbers
			lowers = this.countRegExp(passwordVal, /[a-z]/g),
			uppers = this.countRegExp(passwordVal, /[A-Z]/g), //upper case
			specials = this.countRegExp(passwordVal, allowableSpecilaChars), //special characters
			spaces = this.countRegExp(passwordVal, /\s/g);

            //check for invalid characters
            inValidChars = passwordVal.replace(/[a-z]/gi, "") + inValidChars.replace(/\d/g, "");
            inValidChars = inValidChars.replace(/\d/g, "");
            inValidChars = inValidChars.replace(allowableSpecilaChars, "");

            //check space
            if (spaces > 0) {
                return "No spaces!";
            }

            //invalid characters
            if (inValidChars !== '') {
                return "Invalid character: " + inValidChars;
            }

            //max length
            if (len > password_settings.maxLength) {
                return "Password too long!";
            }

            //GET NUMBER OF CHARACTERS left
            if ((specials + uppers + nums + lowers) < password_settings.minLength) {
                msg += password_settings.minLength - (specials + uppers + nums + lowers) + " more characters, ";
            }

            //at the "at least" at the front
            if (specials == 0 || uppers == 0 || nums == 0 || lowers == 0) {
                msg += "At least ";
            }

            //GET NUMBERS
            if (nums >= password_settings.numberLength) {
                nums = password_settings.numberLength;
            }
            else {
                msg += (password_settings.numberLength - nums) + " more numbers, ";
            }

            //special characters
            if (specials >= password_settings.specialLength) {
                specials = password_settings.specialLength
            }
            else {
                msg += (password_settings.specialLength - specials) + " more symbol, ";
            }

            //upper case letter
            if (uppers >= password_settings.upperLength) {
                uppers = password_settings.upperLength
            }
            else {
                msg += (password_settings.upperLength - uppers) + " Upper case characters, ";
            }

            //strength for length
            if ((len - (uppers + specials + nums)) >= (password_settings.minLength - password_settings.numberLength - password_settings.specialLength - password_settings.upperLength)) {
                pStrength += (password_settings.minLength - password_settings.numberLength - password_settings.specialLength - password_settings.upperLength);
            }
            else {
                pStrength += (len - (uppers + specials + nums));
            }

            //password strength
            pStrength += uppers + specials + nums;

            //detect missing lower case character
            if (lowers === 0) {
                if (pStrength > 1) {
                    pStrength -= 1; //Reduce 1
                }
                msg += "1 lower case character, ";
            }

            //strong password
            if (pStrength == password_settings.minLength && lowers > 0) {
                msg = "Strong password!";
            }

            return msg + ';' + pStrength;
        }
    }

    //default setting
    var password_settings = {
        minLength: 12,
        maxLength: 25,
        specialLength: 1,
        upperLength: 1,
        numberLength: 1,
        barWidth: 200,
        barColor: 'Red',
        mediumColor: 'Orange',
        strongColor: 'Green',
        specialChars: '!@#$', //allowable special characters
        messages: [],
        metMinRequirement: false,
        metRequirement: false
    };

    //password strength plugin 
    $.fn.password_strength = function (options) {

        //check if password met requirement

        if (typeof(options.minLength) != 'undefined')
            password_settings.minLength = options.minLength;
        if (typeof(options.maxLength) != 'undefined')
            password_settings.maxLength = options.maxLength;
        if (typeof(options.specialLength) != 'undefined')
            password_settings.specialLength = options.specialLength;
        if (typeof(options.upperLength) != 'undefined')
            password_settings.upperLength = options.upperLength;
        if (typeof(options.numberLength) != 'undefined')
            password_settings.numberLength = options.numberLength;
        if (typeof(options.barWidth) != 'undefined')
            password_settings.barWidth = options.barWidth;
        if (typeof (options.barColor) != 'undefined')
            password_settings.barColor = options.barColor;
        if (typeof (options.mediumColor) != 'undefined')
            password_settings.mediumColor = options.mediumColor;
        if (typeof (options.strongColor) != 'undefined')
            password_settings.strongColor = options.strongColor;
        if (typeof (options.messages) != 'undefined')
            password_settings.messages = options.messages;
        if (typeof (options.specialChars) != 'undefined')
            password_settings.specialChars = options.specialChars;

        this.metReq = function () {
            return password_settings.metRequirement;
        }
        this.metMinReq = function () {
            return password_settings.metMinRequirement;
        }

        ////read password setting from xml file
        //$.ajax({
        //    type: "GET",
        //    url: "PasswordPolicy.xml", //use absolute link if possible
        //    dataType: "xml",
        //    success: function (xml) {

        //        $(xml).find('Password').each(function () {
        //            var _minLength = $(this).find('minLength').text(),
        //            _maxLength = $(this).find('maxLength').text(),
        //            _numsLength = $(this).find('numsLength').text(),
        //            _upperLength = $(this).find('upperLength').text(),
        //            _specialLength = $(this).find('specialLength').text(),
        //            _barWidth = $(this).find('barWidth').text(),
        //            _barColor = $(this).find('barColor').text(),
        //            _specialChars = $(this).find('specialChars').text();

        //            //set variables
        //            password_settings.minLength = parseInt(_minLength);
        //            password_settings.maxLength = parseInt(_maxLength);
        //            password_settings.specialLength = parseInt(_specialLength);
        //            password_settings.upperLength = parseInt(_upperLength);
        //            password_settings.numberLength = parseInt(_numsLength);
        //            password_settings.barWidth = parseInt(_barWidth);
        //            password_settings.barColor = _barColor;
        //            password_settings.specialChars = _specialChars;
        //        });
        //    }
        //});

        return this.each(function () {

            //bar position
            var barLeftPos = $("[id$='" + this.id + "']").position().left + $("[id$='" + this.id + "']").width() / 2;
            var barTopPos = $("[id$='" + this.id + "']").position().top + $("[id$='" + this.id + "']").height() + 6;

            var container = $('<div id="PasswordStrengthContainer"></div>')
                .css({ display: 'inline-block', float: 'right', width: '220px'});

            //add the container next to textbox
            $(this).after(container);

            //bar border and indicator div
            var passBar = $('<div id="PasswordStrengthBorder"></div>')
                .css({ display: 'inline-block', display: 'none', height: 3, margin: '5px 0 0 0', 'border-style': 'solid', 'border-width': 1, padding: 2 })

            var passIndi = $('<div id="PasswordStrengthBar" class="BarIndicator"></div>')
                .css({ display: 'block', height: 5, marginTop: "-1px" });

            passBar.append(passIndi);
            //set max length of textbox
            //$("[id$='" + this.id + "']").attr('maxLength', password_settings.maxLength);

            //add the boder and div
            container.append(passBar);


            //password indicator text container
            var passText = $('<div id="PasswordStrengthText"></div>')
                .css({ 'font-size': '75%', float: 'left', width: password_settings.barWidth + 10 });

            container.append(passText);

            $(this).keyup(function () {

                var passwordVal = $(this).val(); //get textbox value

                //set met requirement to false
                password_settings.metRequirement = false;
                password_settings.metMinRequirement = false;

                if (passwordVal.length > 0) {

                    var msgNstrength = password_Strength.getStrengthInfo(passwordVal);

                    var msgNstrength_array = msgNstrength.split(";"), strengthPercent = 0,
                    barWidth = password_settings.barWidth;

                    //calculate the bar indicator length
                    if (msgNstrength_array.length > 1) {
                        strengthPercent = (msgNstrength_array[1] / password_settings.minLength) * barWidth;
                    }

                    if (strengthPercent >= (barWidth * 0.75) && passwordVal.length >= password_settings.minLength) {
                        password_settings.metMinRequirement = true;
                    }
                    if (strengthPercent == barWidth) {
                        password_settings.metRequirement = true;
                    }

                    $("[id$='PasswordStrengthBorder']").css({ display: 'inline-block', width: barWidth });
                    $("[id$='PasswordStrengthBar']").css({
                        width: strengthPercent,
                        'background-color':
                                password_settings.metRequirement ? password_settings.strongColor :
                                password_settings.metMinRequirement ? password_settings.mediumColor : password_settings.barColor
                    });

                    //remove last "," character
                    if (password_settings.messages.length == 0) {
                        if (msgNstrength_array[0].lastIndexOf(",") !== -1) {
                            passText.text(msgNstrength_array[0].substring(0, msgNstrength_array[0].length - 2));
                        }
                        else {
                            passText.text(msgNstrength_array[0]);
                        }
                    }
                    else if (strengthPercent == barWidth) {
                        passText.text(password_settings.messages[password_settings.messages.length - 1]);
                    }
                    else {
                        var index = Math.floor((strengthPercent / barWidth) * (password_settings.messages.length - 1));
                        passText.text(password_settings.messages[index]);
                    }

                }
                else {
                    passText.text('');
                    $("[id$='PasswordStrengthBorder']").css("display", "none"); //hide
                    $("[id$='PasswordStrengthBar']").css("display", "none"); //hide
                }
            });
        });
    };

})(jQuery);