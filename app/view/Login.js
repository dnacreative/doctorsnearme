﻿/**
 * Authored by Amaya
 */
Ext.define('DoctorsNearMe.view.Login', {
    extend: 'Ext.Container',
    xtype: 'loginview',
    requires: ['Ext.Img', 'Ext.form.FieldSet', 'Ext.field.Email', 'Ext.field.Password', 'Ext.field.Checkbox'],
    config: {
        layout: 'vbox',
        scrollable:'vertical',
        cls: 'login',
        style: 'background-color:#F3E3E5;',
        hideAnimation: {
            type: 'popIn',
            duration: 250,
            easing: 'ease-in'
        },
        items: [
            {//0
                xtype: 'button',
                cls:'signup-btn'
               // text: '<span class="signup-label">Sign up</span>'
            },            
            {//1
                xtype: 'container',
                cls:'signin-fieldset-container',
                items: [
                    {
                        xtype: 'textfield',
                        name: 'username',
                        required: true,
                       // label: 'Username or email',
                        labelAlign:'top',
                        labelCls: 'username-pwd'
                    },
                    {
                        xtype: 'passwordfield',
                       // label: 'Password',
                        labelAlign: 'top',
                        name: 'password',
                        required: true,
                        labelCls: 'username-pwd'
                    }
                ]
            },
            {//forgot login
                xtype: 'button',
                //  html: 'Forgot Login/pass?',
                cls: 'forgot-login',
                labelCls: 'forgotlogin-label'
            },
            {
                xtype: 'button',
               // text: '<span class="signin-label">Sign In</span>',
                cls:'signin-btn'
            },
            {
                xtype: 'button',
                width: '40%',
                cls:'cancel-btn'
               // text:'<span class="cancel-label">CANCEL</span>'
            },
            {
                xtype: 'label',
                html: '<a href="market://details?id=com.raxa.EMR">Try Raxa App!</a>',
                cls:'app-link'
            }
            
        ]
    },

    getSignUpButton: function(){
        return this.getComponent(0);
    },
    
    getLoginButton: function(){
        return this.getComponent(3);
    },

    getCancelButton: function(){
        return this.getComponent(4);
    },

    getFieldSet: function(){
        return this.getComponent(1);
    },

    getUsernameField: function(){
        return this.getFieldSet().getComponent(0);
    },

    getPasswordField: function(){
        return this.getFieldSet().getComponent(1);
    },

    getForgotLoginField: function(){
        return this.getComponent(2);
    },

    initialize: function () {

        var loginButton = this.getLoginButton();
        var cancelButton = this.getCancelButton();
        var me = this;
        loginButton.on('tap', function() {
            me.fireEvent('login');
        });

        cancelButton.on('tap', function() {
            me.fireEvent('cancel');
        });

        this.callParent();
        this.setLanguage();

        this.setPasswordForgotHandler();
    },

    setPasswordForgotHandler: function(){
        var me= this;
        this.getForgotLoginField().on('tap', function () {
            me.fireEvent('forgotpassword', me.getUsernameField().getValue());
            console.log("tapped");
            // var newValue = Ext.getCmp('usernameEmailForgot').getValue();
        });
    },

    /**
     * Get the values of the username and password field 
     * @method
     * @public
     */
    getTheValues: function () {
        var fieldSet = this.getFieldSet();

        var userName = this.getUsernameField().getValue();
        var password = this.getPasswordField().getValue();

        return { userName: userName, password: password };
    },

    /**
     * Set language 
     * @method
     * @public
     */
    setLanguage: function () {
        var lang = DoctorsNearMe.config.getLanguage();

        this.getSignUpButton().setText('<span class="signup-label">' + lang.SIGNUP + '</span>');
        this.getUsernameField().setLabel(lang.USER_OR_EMAIL);
        this.getPasswordField().setLabel(lang.PASSWORD);
        this.getForgotLoginField().setHtml(lang.FORGOT);
        this.getLoginButton().setText('<span class="signin-label">' + lang.LOG_IN+'</span>');
        this.getCancelButton().setText('<span class="cancel-label">' + lang.CANCEL+'</span>');
    }

});