/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars


{
  'use strict'
  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', 
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };
  
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };
  
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };
  
  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END 
  };


  class Product {
    constructor(id, data) {
      const thisProduct = this;
      
      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();

     // console.log('new Product:', thisProduct);
    }
    renderInMenu() {
      const thisProduct = this;
      /*generate HTML based on template*/
      const generatedHTML = templates.menuProduct(thisProduct.data);
      /*create element using utils.createElementFromHTML*/
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      /*find menu Container*/
      const menuContainer = document.querySelector(select.containerOf.menu);
      /*add element to menu*/
      menuContainer.appendChild(thisProduct.element);
    }
    getElements() {
      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      //console.log(thisProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      //console.log(thisProduct.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAccordion() {
      const thisProduct = this;
      /*find the clickable trigger(the element that should react to clicking)*/
      /*const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      console.log(clickableTrigger);*/

      /* START: add event listener to clickable trigger on event click */
      thisProduct.accordionTrigger.addEventListener('click', function (event) {
        /* prevent default action for event */
        event.preventDefault();
        /* find active product (product that has active class) */
        const activeProducts = document.querySelectorAll(select.all.menuProductsActive);

        /* if there is active product and it's not thisProduct.element, remove class active from it */
        for (let activeProduct of activeProducts) {
          console.log('activeProduct: ', activeProduct);
          if (activeProduct != thisProduct.element) {
            activeProduct.classList.remove('active');
          }
        }
        /* toggle active class on thisProduct.element */
        thisProduct.element.classList.toggle('active');


      });
    }
    initOrderForm() {
      const thisProduct = this;
     // console.log(thisProduct);
      thisProduct.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }
    initAmountWidget(){
      const thisProduct = this;

      thisProduct.amountWidget = new amountWidget(thisProduct.amountWidgetElem);

      thisProduct.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
      } )
    }
    addToCart(){
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
    }
    prepareCartProduct(){
      const thisProduct = this;
      

      const productSummary= {
        id: thisProduct.id,
        name: thisProduct.data.name,
      amount: thisProduct.amountWidget.value,
      priceSingle: thisProduct.priceSingle,
      price: thisProduct.priceTotal,
      params: thisProduct.prepareCartProductParams(),
      };
      return productSummary;
    }
    prepareCartProductParams (){
      const thisProduct = this;
      //console.log(thisProduct);
      const formData = utils.serializeFormToObject(thisProduct.form);
     const params ={};
      

      // for every category (param)...
      for (let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        params [paramId]={
          label:param.label,
          options:{}
        }

        // for every option in this category
        for (let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];  
          const optionSelected = formData[paramId]&& formData[paramId].includes(optionId);
         if (optionSelected){
           params[paramId].options[optionId] = option.label;
         }
         
        }
      }
      return params;
    }
    processOrder() {
      const thisProduct = this;
      //console.log(thisProduct);
      const formData = utils.serializeFormToObject(thisProduct.form);
      //console.log('formData', formData);
      // set price to default price
      let price = thisProduct.data.price;

      // for every category (param)...
      for (let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        //console.log(paramId, param);

        // for every option in this category
        for (let optionId in param.options) {
          const optionImage = thisProduct.imageWrapper.querySelector('.'  + paramId + '-' + optionId);
          //console.log(optionImage)
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];  
          // check if option is selected
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          // check if there is param with name of paramId in formData and if it includes optionId
          //console.log('form:', formData[paramId].includes(optionId));
          if(optionImage !== null){
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          }
          if(optionSelected) {

            // check if the option is not default
            if (option.default != true) {
              
              // add option price to variable
              price = price + option.price;
              
            }
          } else {
            if(optionImage !==null){
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
            // check if the option is default
            if (option.default == true) {
              // reduce price variable
              price = price - option.price;
            }
          }
        }
      }
      thisProduct.priceSingle = price;
      thisProduct.priceTotal = price * thisProduct.amountWidget.value;
      price *= thisProduct.amountWidget.value;
      // update calculated price in the HTML
      thisProduct.priceElem.innerHTML = price;
    }
    
  }
  class amountWidget {
    constructor(element){
      const thisWidget = this;

      thisWidget.getElements(element);

      thisWidget.setValue(settings.amountWidget.defaultValue);
      thisWidget.initActions();
      

     // console.log('AmountWidget:',thisWidget);
      //console.log('constructor arguments:', element);
    }
    getElements(element){
      const thisWidget= this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector (select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
      thisWidget.setValue(thisWidget.input.value);
      
    }
    setValue(value){
      const thisWidget = this;

      const newValue = parseInt(value);

      /* TODO: Add validation*/

      if(thisWidget.value !== newValue  && !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax +1){
        thisWidget.value = newValue;
      }
      thisWidget.input.value = thisWidget.value;
      thisWidget.announce();
    }
    initActions (){
      const thisWidget = this;
     // console.log(thisWidget);
      thisWidget.input.addEventListener('change', function () {
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click',function (event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      } );
      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value +1);
      });
    }
    announce(){
      const thisWidget = this;

      const event = new CustomEvent('updated',{
      bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }
  }
  class Cart {
    constructor(element){ 
    const thisCart = this;
    thisCart.products = [];
    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
    thisCart.getElements(element);
    thisCart.initActions();
    //console.log('new Cart', thisCart);
    
    }
  getElements(element){
    const thisCart = this;
    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
   // console.log(thisCart.dom.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    console.log(thisCart.dom.totalPrice);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
  }
  
  initActions (){
    const thisCart= this;
    thisCart.dom.toggleTrigger.addEventListener('click', function(){
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });
    thisCart.dom.productList.addEventListener('updated', function(){
      thisCart.update();
    })
    thisCart.dom.productList.addEventListener('remove', function(event){
      thisCart.remove(event.detail.cartProduct);
    })
    thisCart.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisCart.sendOrder();
    })
  }
  sendOrder (){
    const thisCart =this;
    const url = settings.db.url + '/' + settings.db.orders;

    const payload = {
      adress: thisCart.dom.address.value,
      phone: thisCart.dom.phone.value,
      totalPrice: thisCart.dom.totalPrice,
      subtotalPrice: thisCart.dom.subtotalPrice,
      totalNumber: thisCart.dom.totalNumber,
      deliveryFee: thisCart.dom.deliveryFee,
      products:[],
    
    }
  
    for(let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function(response) {
        return response.json();
      })
      .then(function(parsedResponse){
        console.log('parsedResponse: ', parsedResponse);
      });
  }
  
  add(menuProduct) {
    const thisCart = this;
    const generatedHTML = templates.cartProduct(menuProduct);
   const generatedDOM = utils.createDOMFromHTML(generatedHTML);
   thisCart.dom.productList.appendChild(generatedDOM);
   thisCart.products.push (new CartProduct(menuProduct,generatedDOM));
   //console.log('thisCart.products', thisCart.products);
   thisCart.update();

   // console.log('adding product', menuProduct);
  }
  update(){
    const thisCart = this;
    thisCart.deliveryFee =  settings.cart.defaultDeliveryFee;
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;

    for(let product of thisCart.products){
      console.log(product);
      thisCart.totalNumber +=product.amount;
      thisCart.subtotalPrice +=product.price;

    }
    if(thisCart.totalNumber !==0){
      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
    }else {
      thisCart.totalPrice = thisCart.subtotalPrice;
    }
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
      thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      for(let price of thisCart.dom.totalPrice){
        price.innerHTML = thisCart.totalPrice;
      }

  }
  remove(cartProduct){
    const thisCart= this;
    const indexOfProducts = thisCart.products.indexOf(CartProduct);
    console.log(indexOfProducts);
    const removedValues = thisCart.products.splice(indexOfProducts);
    console.log(removedValues);
    cartProduct.dom.wrapper.remove();
    thisCart.update();


  }
  }
  class CartProduct{
    constructor (menuProduct, element){
      const thisCartProduct = this;
      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.params = menuProduct.params;
      
      thisCartProduct.getElements(element);
     // console.log('new Cart Product:' ,thisCartProduct);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
     
    }
    getElements(element){
      const thisCartProduct = this;
      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove); 

    }
    getData (){
      const thisCartProduct = this;

      const orderSummary = {
      id: thisCartProduct.id,
      amount : thisCartProduct.amount,
      price: thisCartProduct.price,
      priceSingle: thisCartProduct.priceSingle,
      params: thisCartProduct.params,
      }
      return orderSummary;
    }
    initAmountWidget(){
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new amountWidget(thisCartProduct.dom.amountWidget);

      thisCartProduct.dom.amountWidget.addEventListener('updated', function(){
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      })
    }
    remove(){
      const thisCartProduct = this;

      const event = new CustomEvent('remove',{
        bubbles: true,
        detail: {
          cartProduct:thisCartProduct,
        }
      })
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }
    initActions(){
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault;
      });
      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault;
        thisCartProduct.remove();
       // console.log(thisCartProduct.remove)

      });

    }
    
  }

  const app = {
    initData: function () {
      const thisApp = this;

      thisApp.data = {};

      const url = settings.db.url + '/' + settings.db.products;

      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          console.log('parsedResponse', parsedResponse);
          //save parsedResponse as thisApp.data.products
          thisApp.data.products = parsedResponse;
          //execute initMenu method
          thisApp.initMenu();
        })
        console.log('thisApp.data', JSON.stringify(thisApp.data));
    },
    initMenu: function () {
      const thisApp = this;
     // console.log('thisApp.data:', thisApp.data);
      for (let productData in thisApp.data.products) {
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },
    initCart: function(){
      const thisApp =this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart (cartElem);
    },
   
    init: function () {
      const thisApp = this;
      //console.log('*** App starting ***');
      //console.log('thisApp:', thisApp);
      //console.log('classNames:', classNames);
      //console.log('settings:', settings);
      //console.log('templates:', templates);
      thisApp.initData();
      app.initCart();
     
      

      //console.log('thisApp.data:', thisApp.data);
     
    },

    
    
  };

  app.init();
  
}
