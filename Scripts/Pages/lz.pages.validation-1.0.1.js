// we add a custom jquery validation method
jQuery.validator.addMethod('isTrue', function (value, element, params) {
    return (value === true || value === 'true');
}, '');

// and an unobtrusive adapter
jQuery.validator.unobtrusive.adapters.add('istrue', {}, function (options) {
    options.rules['isTrue'] = true;
    options.messages['isTrue'] = options.message;
});

// we add a custom jquery validation method
jQuery.validator.addMethod('isPasswordEnough', function (value, element, params) {
    return element.passStrength.metMinReq();
}, '');

// and an unobtrusive adapter
jQuery.validator.unobtrusive.adapters.add('passwordstrength', {}, function (options) {
    options.rules['isPasswordEnough'] = true;
    options.messages['isPasswordEnough'] = options.message;
});

$(function () {

    // Run this function for all validation error messages
    $('.field-validation-error, field-validation-valid').each(function () {
        // Get the name of the element the error message is intended for
        // Note: ASP.NET MVC replaces the '[', ']', and '.' characters with an
        // underscore but the data-valmsg-for value will have the original characters
        var inputElem = '#' + $(this).attr('data-valmsg-for').replace('.', '_').replace('[', '_').replace(']', '_');

        var corners = ['top center', 'bottom center'];
        var flipIt = $(inputElem).parents('span.right').length > 0;

        // Hide the default validation error
        $(this).hide();

        // Show the validation error using qTip
        $(inputElem).filter(':not(.valid)').qtip({
            content: { text: $(this).text() }, // Set the content to be the error message
            position: {
                my: corners[flipIt ? 1 : 1],
                at: corners[flipIt ? 0 : 0],
                viewport: $(window)
            },
            show: { ready: true },
            hide: false,
            style: { classes: 'ui-dark' }
        });
    });
});