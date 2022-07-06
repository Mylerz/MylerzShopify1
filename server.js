require("isomorphic-fetch");
const dotenv = require("dotenv");
const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const next = require("next");
const { default: createShopifyAuth } = require("@shopify/koa-shopify-auth");
const { verifyRequest } = require("@shopify/koa-shopify-auth");
const session = require("koa-session");
// const { default: graphQLProxy } = require('@shopify/koa-shopify-graphql-proxy');
// const { ApiVersion } = require('@shopify/koa-shopify-graphql-proxy');
const Router = require("koa-router");
const cors = require("@koa/cors");
const { log } = require("console");

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";
// process.env.NODE_OPTIONS = '--inspect'
const app = next({});
const handle = app.getRequestHandler();

const {
  SHOPIFY_API_SECRET_KEY,
  SHOPIFY_API_KEY,
  INTEGRATION_API,
  SHOPIFY_BRIDGE,
  API_VERSION
} = process.env;

console.log("before app prepare,API_Key: -->", SHOPIFY_API_KEY);

app.prepare().then(() => {
  const server = new Koa();
  server.use(cors());
  const router = new Router();
  server.use(bodyParser());

  server.use(session({ secure: true, sameSite: "none" }, server));
  server.keys = [SHOPIFY_API_SECRET_KEY];

  // server.use(cors)

  server.use(
    createShopifyAuth({
      apiKey: SHOPIFY_API_KEY,
      secret: SHOPIFY_API_SECRET_KEY,
      scopes: [
        "read_products",
        "read_orders",
        "write_orders",
        "read_fulfillments",
        ,
        "write_fulfillments",
        "read_assigned_fulfillment_orders",
        "write_assigned_fulfillment_orders",
        "read_merchant_managed_fulfillment_orders",
        "write_merchant_managed_fulfillment_orders",
        "read_third_party_fulfillment_orders",
        "write_third_party_fulfillment_orders",
        "read_shipping",
        "write_shipping",
        "read_inventory",
        "write_inventory",
      ],
      afterAuth(ctx) {
        console.log("After Auth ,API_Key: -->", SHOPIFY_API_KEY);

        const { shop, accessToken } = ctx.session;

        console.log("before app prepare,accesstoken: -->", accessToken);

        ctx.cookies.set("shopOrigin", shop, {
          httpOnly: false,
          secure: true,
          sameSite: "none",
        });
        ctx.cookies.set("accessToken", accessToken, {
          httpOnly: false,
          secure: true,
          sameSite: "none",
        });
        ctx.redirect("/");
      },
    })
  );

  server.use(router.routes());
  // server.use(graphQLProxy({version: ApiVersion.October19}))
  server.use(verifyRequest());

  // router.all('*', async (ctx) => {
  //   await handle(ctx.req, ctx.res)
  //   ctx.respond = false
  // })

  server.use(async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
    return;
  });

  Object.defineProperty(Array.prototype, "flat", {
    value: function (depth = 1) {
      return this.reduce(function (flat, toFlatten) {
        return flat.concat(
          Array.isArray(toFlatten) && depth > 1
            ? toFlatten.flat(depth - 1)
            : toFlatten
        );
      }, []);
    },
  });

  const getInventoryItemIds = async (variantIds, ctx) => {
    try {
      let Inventory = await Promise.all(
        variantIds.map(async (variantId) => {
          let url = `https://${ctx.cookies.get(
            "shopOrigin"
          )}/admin/api/${API_VERSION}/variants/${variantId}.json`;

          let response = await fetch(url, {
            method: "GET",
            headers: {
              "X-Shopify-Access-Token": ctx.cookies.get("accessToken"),
            },
          });

          let variantIdsResponse = await response.json();
          console.log("variantIdsResponse: ", variantIdsResponse);
          return variantIdsResponse.variant.inventory_item_id;
        })
      );

      return Inventory;
    } catch (err) {
      console.log("Error: ", err);
      return [];
    }
  };

  const getInventoryLevels = async (inventoryItemIds, ctx) => {
    try {
      // let variantIds = ctx.request.body

      let inventoryLevels = await Promise.all(
        inventoryItemIds.map(async (inventoryItemId) => {
          console.log("Inventory_Item_ID-->", inventoryItemId);
          let url = `https://${ctx.cookies.get(
            "shopOrigin"
          )}/admin/api/${API_VERSION}/inventory_levels.json?inventory_item_ids=${inventoryItemId}`;

          let response = await fetch(url, {
            method: "GET",
            headers: {
              "X-Shopify-Access-Token": ctx.cookies.get("accessToken"),
            },
          });
          let Inventory_Levels = (await response.json()).inventory_levels;
          console.log("InventoryLevels-->", Inventory_Levels);
          return Inventory_Levels;
        })
      );

      return {
        status: "success",
        InventoryLevel: inventoryLevels,
      };
    } catch (err) {
      console.log(err);
      return {
        status: "failed",
        Error: err,
      };
    }
  };

  const getLocations = (inventoryLevels) => {
    return inventoryLevels.map(
      (orderInventoryLevels) =>
        orderInventoryLevels.InventoryLevel.map(
          (itemInventoryLevels) => itemInventoryLevels[0].location_id
        )[0]
    );
  };

  const getLocationNames = async (locationIds, ctx) => {
    try {
      let locationNames = await Promise.all(
        locationIds.map(async (locationId) => {
          let url = `https://${ctx.cookies.get(
            "shopOrigin"
          )}/admin/api/${API_VERSION}/locations/${locationId}.json`;

          let response = await fetch(url, {
            method: "GET",
            headers: {
              "X-Shopify-Access-Token": ctx.cookies.get("accessToken"),
            },
          });
          let location = (await response.json()).location;
          return location.name;
        })
      );

      return {
        status: "success",
        LocationNames: locationNames,
      };
    } catch (err) {
      console.log(err);
      return {
        status: "failed",
        Error: err,
      };
    }
  };

  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  const createFulfillment = async (order, barcodeItemsTupleList, ctx) => {
    let fulfillment_orders_fetch_url = `https://${ctx.cookies.get(
      "shopOrigin"
    )}/admin/api/${API_VERSION}/orders/${
      order.id
    }/fulfillment_orders.json?status=open`;

    let fulfillment_orders_response = await fetch(
      fulfillment_orders_fetch_url,
      {
        method: "GET",
        headers: {
          "content-type": "application/json",
          "X-Shopify-Access-Token": ctx.cookies.get("accessToken"),
        },
      }
    );
    let fulfillment_orders_result = await fulfillment_orders_response.json();

    // let fulfillment_result = []

    let fulfillment_result = await Promise.all(
      fulfillment_orders_result.fulfillment_orders.map(
        async (fulfillment_order, index) => {
          let checkFailedRequestObject = {};
          do {
            if (checkFailedRequestObject.errors) {
              await sleep(1000);
            }
            let line_items = fulfillment_order.line_items.map((line_item) => {
              return { id: line_item.line_item_id };
            });

            let tracking_numbers = line_items.map((line_item) => {
              console.log(`barcodeItemsTupleList: ${barcodeItemsTupleList}`);
              return barcodeItemsTupleList.find(
                (tuple) => tuple.Item1.id == line_item.id
              ).Item2;
            });

            tracking_numbers = [...new Set(tracking_numbers)];

            let fulfillmentObject = {
              fulfillment: {
                location_id: fulfillment_order.assigned_location_id,
                tracking_numbers: tracking_numbers,
                tracking_urls: tracking_numbers.map(
                  (track) => `https://mylerz.net/trackShipment/${track}`
                ),
                tracking_company: "Mylerz",
                line_items: line_items,
              },
            };
            let fetchUrl = `https://${ctx.cookies.get(
              "shopOrigin"
            )}/admin/api/${API_VERSION}/orders/${order.id}/fulfillments.json`;

            let response = await fetch(fetchUrl, {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "X-Shopify-Access-Token": ctx.cookies.get("accessToken"),
              },
              body: JSON.stringify(fulfillmentObject),
            });
            checkFailedRequestObject = await response.json();
            console.log(checkFailedRequestObject);
          } while (checkFailedRequestObject.errors);
          return checkFailedRequestObject;
        }
      )
    );

    return fulfillment_result;
  };

  const attachPickupOrder = async (orderID, tags, pickupOrdersIDs, ctx) => {
    let url = `https://${ctx.cookies.get(
      "shopOrigin"
    )}/admin/api/${API_VERSION}/orders/${
      orderID
    }.json`;
    
    let tagsString = tags.length>0 ? tags+ ", " + pickupOrdersIDs.join(", "): tags + pickupOrdersIDs.join(", ");
    
    let requestObject = { 
      order: { 
        id: orderID, 
        tags: tagsString 
      }
    }
    
    console.log("tagString: " + tagsString);


    let request = await fetch(
      url,
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "X-Shopify-Access-Token": ctx.cookies.get("accessToken"),
        },
        body: JSON.stringify(requestObject),
      }
    );

    let result = await request.json();
    
    // console.log("attach Result : "+ JSON.stringify(result))
    return result;
  };

  const getAWB = async (barcodeList, token) => {
    try {
      console.log(`barcodeList:${barcodeList}`);
      //console.log(`token:${token}`);
      let AwbList = await Promise.all(
        barcodeList.map(async (barcode) => {
          let request = await fetch(
            `${INTEGRATION_API}/api/packages/GetAWB`,
            {
              method: "POST",
              headers: {
                Authorization: `bearer ${token}`,
                "content-type": "application/json",
              },

              body: JSON.stringify({ Barcode: barcode }),
            }
          );

          let result = await request.json();
          // console.log(result);
          return result;
        })
      );

      return AwbList;
    } catch (error) {
      console.log("In awb catch");
      console.log(error);
      return null;
    }
  };

  const createPickupOrder = async (barcodeList, token) => {
    try {
 
      let requestObject = barcodeList.map(barCode=>{return {Barcode:barCode}});

      console.log(requestObject)
      let request = await fetch(
        `${INTEGRATION_API}/api/packages/CreateMultiplePickup`,
        {
          method: "POST",
          headers: {
            Authorization: `bearer ${token}`,
            "content-type": "application/json",
          },

          body: JSON.stringify(requestObject),
        }
      );

      let result = await request.json();
      console.log(result);
      return result;
    } catch (error) {
      console.log("In createPickupOrder catch");
      console.log(error);
      return null;
    }
  };

  const getNextPageUrl = (link) => {
    // if there are next page
    if (link.split(",").slice(-1)[0].split(";")[1].split("=")[1] == '"next"') {
      let url = link.split(",").slice(-1)[0].split(";")[0].trim();

      return url.substring(1, url.length - 1);
    } else {
      return null;
    }
  };

  router.post("/api/getZones", async (ctx) => {
    try {
      console.log(ctx.request.body.token);
      console.log(ctx.request.body.addressList);
      let request = await fetch(
        `${INTEGRATION_API}/api/orders/GetZones`,
        {
          method: "POST",
          headers: {
            Authorization: `bearer ${ctx.request.body.token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(ctx.request.body.addressList),
        }
      );

      let result = await request.json();

      console.log(result);

      if (!result.IsErrorState) {
        ctx.body = {
          status: "success",
          Zones: result.Value,
        };
      } else {
        ctx.body = {
          status: "failed",
          Error: result.ErrorDescription,
        };
      }
    } catch (error) {
      ctx.body = {
        status: "failed",
        Error: error,
      };
    }
  });

  router.get("/api/getCityZoneList", async (ctx) => {
    try {
      //console.log(ctx.request.body.token);
      //console.log(ctx.request.body.addressList);
      let request = await fetch(
        `${INTEGRATION_API}/api/packages/GetCityZoneList`
      );

      let result = await request.json();

      //console.log(result);

      if (!result.IsErrorState) {
        ctx.body = {
          status: "success",
          Cities: result.Value,
        };
      } else {
        ctx.body = {
          status: "failed",
          Error: result.ErrorDescription,
        };
      }
    } catch (error) {
      ctx.body = {
        status: "failed",
        Error: error,
      };
    }
  });

  router.post("/api/orders", async (ctx) => {
    try {
      // let fetchUrl = `https://palmaegypt1.myshopify.com/admin/api/${API_VERSION}/orders.json?${ctx.request.body.param}=${ctx.request.body.value}&limit=250`

      let fetchUrl = ctx.request.body.url;
      console.log("fetchURL--->", fetchUrl);
      let orders = [];
      let i = 0;

      // while (fetchUrl) {

      let request = await fetch(fetchUrl, {
        headers: {
          "X-Shopify-Access-Token": ctx.cookies.get("accessToken"),
        },
      });

      let result = await request.json();

      //console.log(`iteration =  ${i}`);
      //console.log(`orders Count = ${result.orders.length}`);

      // orders.push(...result.orders)

      if (request.headers.get("link")) {
        let link = request.headers.get("link");

        // either return url or null(if there are no next page)
        fetchUrl = getNextPageUrl(link);

        if (fetchUrl) i += 1;
      } else {
        fetchUrl = null;
      }
      // }

      ctx.body = {
        status: "success",
        data: {
          orders: result.orders,
          nextLink: fetchUrl,
        },
      };
    } catch (err) {
      console.log(err);
    }
  });

  router.post("/api/order", async (ctx) => {
    try {
      let orderId = ctx.request.body.id;
      if (orderId) {
        let url = `https://${ctx.cookies.get(
          "shopOrigin"
        )}/admin/api/${API_VERSION}/orders/${orderId}.json`;

        let request = await fetch(url, {
          headers: {
            "X-Shopify-Access-Token": ctx.cookies.get("accessToken"),
          },
        });

        let result = await request.json();

        ctx.body = {
          status: "success",
          data: {
            order: result.order,
          },
        };
      } else {
        ctx.body = {
          status: "failed",
          Message: "No Id Sent",
        };
      }
    } catch (error) {
      ctx.body = {
        status: "failed",
        Message: error,
      };
    }
  });

  router.post("/api/login", async (ctx) => {
    try {
      console.log(ctx.request.body.username);
      console.log(ctx.request.body.password);

      let data = new URLSearchParams();
      data.append("username", ctx.request.body.username);
      data.append("password", ctx.request.body.password),
        data.append("grant_type", "password");

      let response = await fetch(`${INTEGRATION_API}/token`, {
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        method: "POST",
        body: data,
      });

      let result = await response.json();
      console.log(result);

      if (result.error) {
        console.log("in result error");
        ctx.body = {
          status: "failed",
          error: result.error_description,
        };
      } else {
        console.log("in success");
        ctx.body = {
          status: "success",
          data: result,
        };
      }
    } catch (err) {
      console.log("in error");
      console.log(err);
      ctx.body = {
        status: "failed",
        error: err,
      };
    }
  });

  router.post("/api/warehouses", async (ctx) => {
    try {
      console.log(ctx.request.body.token);
      let request = await fetch(
        `${INTEGRATION_API}/api/orders/GetWarehouses`,
        {
          method: "GET",
          headers: {
            Authorization: `bearer ${ctx.request.body.token}`,
            "content-type": "application/json",
          },
        }
      );

      let result = await request.json();

      console.log(result);
      if (result.Message == "Authorization has been denied for this request.") {
        ctx.body = {
          status: "failed",
          Error: result.Message,
        };
      } else if (!result.IsErrorState) {
        let warehouses = result.Value.map((warehouse) => warehouse.Name);
        ctx.body = {
          status: "success",
          Warehouses: warehouses,
        };
      } else {
        ctx.body = {
          status: "failed",
          Error: result.ErrorDescription,
        };
      }
    } catch (error) {
      ctx.body = {
        status: "failed",
        Error: error,
      };
    }
  });

  router.post("/api/getAWB", async (ctx) => {
    try {
      let trackingNumbers = ctx.request.body.trackingNumbers;
      // let token = ctx.request.body.token
      let AWB = await getAWB(trackingNumbers, ctx.cookies.get("access_token"));

      if (AWB.every((awb) => awb.IsErrorState == false)) {
        ctx.body = {
          status: "success",
          AWB: AWB.map((awb) => awb.Value),
          Message: "Fulfillment Completed Successfully",
        };
      } else {
        ctx.body = {
          status: "failed",
          AWB: null,
          Message: AWB[0].ErrorDescription,
        };
      }
    } catch (error) {
      ctx.body = {
        status: "failed",
        error: error,
      };
    }
  });

  router.post("/api/createPickupOrder", async (ctx) => {
    try {
      let barCodes = ctx.request.body.trackingNumbers;
      
      let pickupOrders = await createPickupOrder(barCodes, ctx.cookies.get("access_token"));

      // if (AWB.every((awb) => awb.IsErrorState == false)) {
        ctx.body = {
          status: "success",
          PickupOrders: pickupOrders,
          Message: "PickupOrders Created Successfully",
        };
      // } else {
      //   ctx.body = {
      //     status: "failed",
      //     PickupOrders: null,
      //     Message: "Failed Creating PickupOrders",
      //   };
      // }
    } catch (error) {
      ctx.body = {
        status: "failed",
        error: error,
      };
    }
  });

  router.post("/api/order/fulfill", async (ctx) => {
    try {
      let url = `${SHOPIFY_BRIDGE}/api/orders`;

      let requestBody = ctx.request.body;
      requestBody.warehouse = "";

      let orders = requestBody.orders;

      let response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      let result = await response.json();
      console.log("result---->", result);

      if (result.IsErrorState == false) {
        let trackingNumbers = result.Value.BarcodePerLineItem;

        ctx.body = {
          status: "success",
          Barcodes: trackingNumbers,
          Message: "Fulfillment Completed Successfully",
        };
      } else {
        ctx.body = {
          status: "failed",
          Barcodes: null,
          Message: result.ErrorDescription,
        };
      }
    } catch (err) {
      console.log("in catch server");
      console.log(err);
      ctx.body = {
        status: "failed",
        Message: "Couldn't Complete Fulfillment",
      };
    }
  });

  router.post("/api/order/markAsFulfilled", async (ctx) => {
    try {
      let requestBody = ctx.request.body;
      let order = requestBody.order;
      let barcodes = requestBody.barcodes;

      console.log(`Barcodes: ${barcodes}`);

      let fulfillmentResult = await createFulfillment(order, barcodes, ctx);

      console.log("create Fulfillment-->", fulfillmentResult);

      if (fulfillmentResult.every((fulfillResult) => !fulfillResult.errors)) {
        ctx.body = {
          status: "success",
          Message: "Fulfillment Completed Successfully",
        };
      } else {
        ctx.body = {
          status: "failed",
          Message: fulfillmentResult,
        };
      }
    } catch (err) {
      console.log("in catch server");
      console.log(err);
      ctx.body = {
        status: "failed",
        Message: "Couldn't Complete Fulfillment",
      };
    }
  });
  router.post("/api/order/attachPickupOrder", async (ctx) => {
    try {
      let requestBody = ctx.request.body;
      let orderID = requestBody.orderID;
      let tags = requestBody.tags;
      let pickupOrdersIDs = requestBody.pickupOrdersIDs;

      // console.log(`Barcodes: ${barcodes}`);

      let result = await attachPickupOrder(orderID,tags , pickupOrdersIDs, ctx);

      if (result.order) {
        ctx.body = {
          status: "success",
          Message: "PickupOrder Attached Successfully",
        };
      } else {
        ctx.body = {
          status: "failed",
          Message: "Error Attaching PickupOrderCodes To Order",
        };
      }
    } catch (err) {
      console.log("in catch server");
      console.log(err);
      ctx.body = {
        status: "failed",
        Message: "Error Attaching PickupOrderCodes To Order",
      };
    }
  });

  router.post("/webhooks/customers/redact", async (ctx) => {
    ctx.body = {
      status: "received",
    };
  });
  router.post("/webhooks/shop/redact", async (ctx) => {
    ctx.body = {
      status: "received",
    };
  });
  router.post("/webhooks/customers/data_request", async (ctx) => {
    ctx.body = {
      status: "success",
      data: [],
    };
  });
  server.listen(process.env.PORT);
  console.log(process.env.PORT);
});
