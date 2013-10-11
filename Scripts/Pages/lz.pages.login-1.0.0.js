(function ($) {
    var app = $.sammy('#loginForm', function () {

        this.get("#/Login", function (context) {
            $(".view").hide();
            $("#viewLogin").show();
        });

        this.get("#/Register", function (context) {
            $(".view").hide();
            $("#viewRegister").show();
        });

        this.get("#/ForgotPassword", function (context) {
            $(".view").hide();
            $("#viewForgotPassword").show();
        });

    });

    $(function () {
        app.run('#/Login');
    });
})(jQuery);

$(function () {

    // Register Partial Handling
    // =========================
    
    // Agree to terms handling - replace "terms" word with link
    $leagal = $('#viewRegister .leagal');
    var termsWord = $leagal.attr('termslink');
    if (typeof(termsWord) != 'undefined' && termsWord != '') {
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

    $('#viewRegister #UserName').on('keyup blur change', function () {

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
            
        }

        var account = $(this).val();
        if (account != '') {
            setUserFound('wait');
            $.get('/api/account/get?name=' + encodeURIComponent(account), function (data) {
                setUserFound(data.toString());
            });
        }
        else
            setUserFound();
    });

    var $password = $('#viewRegister input[type=password]').first();
    $password.get(0).passStrength = $password.password_strength({
        minLength: 8,
        specialLength: 0,
        messages: ["Are you kidding me?!", "A little better", "Almost there...", "Now that wan't so hard, was it?"]
    });
});