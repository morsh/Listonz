// Will cancel the idle popup from showing up
lz.cancelIdle = true;

$(function () {
    "use strict";
    var app = $.sammy('#loginForm', function () {

        function showView(viewSelector) {
            $(".view").hide().find('[data-hasqtip]');
            $(viewSelector).show().find('[data-hasqtip]');
        }

        this.get("#/Login", function (context) {
            showView('#viewLogin');
        });

        this.get("#/Register", function (context) {
            showView('#viewRegister');
        });

        this.get("#/ForgotPassword", function (context) {
            showView('#viewForgotPassword');
        });

    });

    $(function () {
        try { 
            var loc = app.getLocation().split('#')[1];
            if (loc != "/Login" && loc != '/Register' && loc != '/ForgotPassword')
                app.setLocation('');
        }
        catch (e) { }
        app.run('#/Login');
    });

    var setRegisterFields = function () {

        if ($('#viewRegister #UserName').data('subscribed')) return;

        // Binding password strength control
        var $password = $('.pass-strength input[type=password]');

        if ($password.length > 0) {
            $password.get(0).passStrength = $password.password_strength({
                minLength: 8,
                specialLength: 0,
                messages: ["Are you kidding me?!", "A little better", "Almost there...", "Now that wan't so hard, was it?"]
            });
        }

        // Register Partial Handling
        // =========================

        // Agree to terms handling - replace "terms" word with link
        var $leagal = $('#viewRegister .leagal');
        var termsWord = $leagal.attr('termslink');
        if (typeof (termsWord) != 'undefined' && termsWord != '') {
            var termsLink = '<a href="#" onclick="return false;">' + termsWord + '</a>';
            $leagal.html($leagal.html().replace(termsWord, termsLink));
            $leagal.find('a').click(function () {
                $('#viewRegister #leagalMessage').clone().dialog({
                    resizable: false,
                    height: 500,
                    modal: true,
                    buttons: {
                        Confirm: function () {
                            $('#viewRegister #Agreement').prop('checked', true);
                            $(this).dialog("close");
                        },
                        Cancel: function () {
                            $('#viewRegister #Agreement').prop('checked', false);
                            $(this).dialog("close");
                        }
                    }
                });
            });
        }

        var checkInputValues = function () {

            $('.narrow .li-input').each(function () {
                var $input = $(this).find('input');
                if ($input.val() == "")
                    $input.closest('.li-input').find('label').show();
                else
                    $input.closest('.li-input').find('label').hide();

                $input.on('focusin focusout blur change', function () {
                    if (document.activeElement != this && $(this).val() == "")
                        $(this).closest('.li-input').find('label').show();
                    else
                        $(this).closest('.li-input').find('label').hide();
                });
            });
        };
        checkInputValues();

        // User name existance check
        var firstCall = true;
        $('#viewRegister #UserName').on('keyup blur change', function () {

            var ctrl = this;
            function setUserFound(status) {
                var $e = $('#viewRegister .user-found').attr('class', 'user-found');
                var title = '';
                if (typeof (status) != 'undefined' && status != '') {
                    $e.addClass(status);
                    switch (status) {
                        case 'wait': title = 'Finding user name...'; break;
                        case 'true': title = 'Oh darn, someone beat you to it.'; break;
                        case 'false': title = 'Now that\'s a star\'s name!'; break;
                    }
                }
                $e.attr('title', title);

                if (firstCall) { firstCall = false; ensureUserUnique(); }
            }

            function ensureUserUnique() {
                var account = $(ctrl).val();
                if (account != '') {
                    setUserFound('wait');
                    $.get('/api/account/get?name=' + encodeURIComponent(account), function (data) {
                        setUserFound(data.toString());
                    });
                }
                else
                    setUserFound();
            }
            ensureUserUnique();
        });

        $('#viewRegister #UserName').data('subscribed', true);
    };

    setRegisterFields();
    $(document).ajaxStop(function () { setRegisterFields(); });
});