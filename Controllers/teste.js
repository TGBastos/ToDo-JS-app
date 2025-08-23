const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
// import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api"; // Supports ESM

const WooCommerce = new WooCommerceRestApi({
  url: 'https://novotoquecosmeticos.com.br',
  consumerKey: 'ck_4066108e1d2e29da4c8e970ddb4032494358c32e',
  consumerSecret: 'cs_606263a9bd25692f6b89b946f6b349e84349dc54',
  version: 'wc/v1'
});

WooCommerce.get("orders/4894")
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.log(error.response.data);
  });