import gql from "graphql-tag";
import warehouseContext from "../components/warehouseContext";

import { Query } from "react-apollo";
import Cookies from "js-cookie";
import {
  InlineError,
  Filters,
  Card,
  ResourceList,
  TextStyle,
  Stack,
  ResourceItem,
  Heading,
  Button,
  Collapsible,
  ExceptionList,
  Scrollable,
  Select,
  Banner,
  Badge,
  ProgressBar,
  Modal
} from "@shopify/polaris";
import { format } from "date-fns";
import { route } from "next/dist/next-server/server/router";
import Router from "next/router";
import Pagination from "react-js-pagination";


class OrdersList extends React.Component {

  static contextType = warehouseContext;

  state = {
    selectedWarehouseForBulk: "",
    isSingleWarehouse: false,
    warehouses: [],
    orderItemWarehouse: [],
    
    selectedOrdersNotReady: false,
    orders: [],
    allOrders: [],
    nextPageUrl: "",
    firstPageUrl: "",
    pageOrders: [],
    activePage: 1,
    numberOfPages: 0,
    selectedNeighborhood: {},
    selectedCities: {},
    selectedOrders: [],
    failedToFetchZones: false,
    previousFailedOrder: [],

    currentlyFulfilledOrder:0,
    totalOrdersToFulfilling:0,
    
    fulfillmentResult: {
      isFulfillmentRequested: false,
      isError: false,
      Message: "",
      AWB: null,
    },
    processing: false,
    queryValue: null,
    activeModal: false,
    neighborhoodOptions: [
      { label: "10th of Ramadan", value: "RMDN" },
      { label: "15th of May", value: "15th of May" },
      { label: "6th of Oct", value: "6th of Oct" },
      { label: "Abbaseya", value: "ABAS" },
      { label: "Abdeen", value: "Abdeen" },
      { label: "Abou Rawash", value: "RWSH" },
      { label: "Abu an Numros", value: "NMRS" },
      { label: "Agouza", value: "Agouza" },
      { label: "Ain Shams", value: "AS" },
      { label: "Al Abageyah", value: "ABAG" },
      { label: "Al Amiriyyah", value: "AMRY" },
      { label: "Al Ayat", value: "AYAT" },
      { label: "Al Badrashin", value: "BDRA" },
      { label: "Al Baragel", value: "BRAG" },
      { label: "Al Khusus", value: "KHSU" },
      { label: "Al Manawat", value: "MNWT" },
      { label: "Al Moatamadeyah", value: "MOTM" },
      { label: "Al Munib", value: "MUNB" },
      { label: "Al Salam", value: "Al-S" },
      { label: "Al Sharabiya", value: "SHRB" },
      { label: "Alexandria", value: "Alexandria" },
      { label: "Ard El Lewa", value: "LWAA" },
      { label: "Aswan", value: "ASWN" },
      { label: "Asyut", value: "ASYT" },
      { label: "Awal Shubra Al Kheimah", value: "KHM1" },
      { label: "Bab El-Shaeria", value: "Bab El-Shaeria" },
      { label: "Badr City", value: "Badr City" },
      { label: "Basateen", value: "Basateen" },
      { label: "Beheira", value: "BEHR" },
      { label: "Beni Suef", value: "BENS" },
      { label: "Boulak", value: "Boulak" },
      { label: "Boulak Eldakrour", value: "Boulak Eldakrour" },
      { label: "CFC", value: "CFC" },
      { label: "Dakahlia", value: "DAKH" },
      { label: "Damietta", value: "DAMT" },
      { label: "Dokki", value: "Dokki" },
      { label: "El Azbakia", value: "El-Azbakia" },
      { label: "El Gamalia", value: "El-Gamalia" },
      { label: "El Giza", value: "GIZA" },
      { label: "El Hadba EL wosta", value: "HDBA" },
      { label: "El Hawamdeyya", value: "HWMD" },
      { label: "El Marg", value: "El-M" },
      { label: "El Mosky", value: "El-Mosky" },
      { label: "El Obour City", value: "OBOR" },
      { label: "El Saf", value: "SAF" },
      { label: "El Shorouk", value: "El Shorouk" },
      { label: "El Talbia", value: "TLBA" },
      { label: "El Waily", value: "El-Waily" },
      { label: "El Zaher", value: "ZAHR" },
      { label: "El Zawya El Hamra", value: "ZWYA" },
      { label: "ELdarb Elahmar", value: "ELdarb Elahmar" },
      { label: "Elsayeda Aisha", value: "ESHA" },
      { label: "Elsayeda Zeinab", value: "Elsayeda Zeinab" },
      { label: "Eltebeen", value: "Eltebeen" },
      { label: "Faiyum", value: "FAYM" },
      { label: "Future City", value: "FUTR" },
      { label: "Ghamra", value: "GHMR" },
      { label: "Gharbia", value: "GHRB" },
      { label: "Hadayek Al Ahram", value: "Hadayek Al Ahram" },
      { label: "Hadayek El Qobah", value: "Hadayek El Qobah" },
      { label: "Haram", value: "Haram" },
      { label: "Heliopolis", value: "HEl" },
      { label: "Helwan", value: "Helwan" },
      { label: "Imbaba", value: "Imbaba" },
      { label: "Ismailia", value: "ISML" },
      { label: "Izbat an Nakhl", value: "NKHL" },
      { label: "Kafr El Sheikh", value: "SHKH" },
      { label: "Kafr Hakim", value: "KFRH" },
      { label: "Kafr Nassar", value: "NASR" },
      { label: "Kafr Tuhurmis", value: "TRMS" },
      { label: "Luxor", value: "LUXR" },
      { label: "Maadi", value: "Maadi" },
      { label: "Madinaty", value: "Madinaty" },
      { label: "Manial", value: "Manial" },
      { label: "Masr El Qadeema", value: "Masr El Qadeema" },
      { label: "Minya", value: "MNYA" },
      { label: "Mohandseen", value: "Mohandseen" },
      { label: "Monufia", value: "MONF" },
      { label: "Nahia", value: "Nahia" },
      { label: "Nasr City", value: "Nasr City" },
      { label: "Nazlet Al Batran", value: "BTRN" },
      { label: "Nazlet El Semman", value: "SMAN" },
      { label: "New Cairo", value: "New Cairo" },
      { label: "New Heliopolis City", value: "NHEL" },
      { label: "North Coast", value: "NorthCoast" },
      { label: "Nozha", value: "Nozha" },
      { label: "Omraneya", value: "Omraneya" },
      { label: "Ossim", value: "OSIM" },
      { label: "Port Said", value: "PORS" },
      { label: "Qalyubia", value: "QLYB" },
      { label: "Qasr elneil", value: "Qasr elneil" },
      { label: "Qena", value: "QENA" },
      { label: "Rod El Farag", value: "FRAG" },
      { label: "Saft El Laban", value: "Saft El Laban" },
      { label: "Saqiyet Mekki", value: "MEKI" },
      { label: "Sharqia", value: "SHRK" },
      { label: "Sheikh Zayed", value: "Sheikh Zayed" },
      { label: "Shoubra", value: "Shoubra" },
      { label: "Shubra El Kheima 2", value: "KHM2" },
      { label: "Shubra Ment", value: "MANT" },
      { label: "Sohag", value: "SOHG" },
      { label: "Suez", value: "SUEZ" },
      { label: "Tura", value: "TURA" },
      { label: "Warraq", value: "Warraq" },
      { label: "Zamalek", value: "Zamalek" },
      { label: "Zeitoun", value: "Zeitoun" },
    ],
    citiesOptions: [],
    cityZoneObject: {},
  };
  neighborhoods = [
    "Ain Shams",
    "Al Salam",
    "El Marg",
    "Heliopolis",
    "Nozha",
    "Nasr City",
    "Zamalek",
    "El Azbakia",
    "El Mosky",
    "El Waily",
    "Abdeen",
    "Bab El-Shaeria",
    "El Gamalia",
    "Boulak",
    "Qasr elneil",
    "ELdarb Elahmar",
    "Badr City",
    "Basateen",
    "Elsayeda Zeinab",
    "Hadayek El Qobah",
    "15th of May",
    "Helwan",
    "Eltebeen",
    "Maadi",
    "Madinaty",
    "Manial",
    "Masr El Qadeema",
    "New Cairo",
    "El Shorouk",
    "Shoubra",
    "Zeitoun",
    "Agouza",
    "Dokki",
    "Boulak Eldakrour",
    "Hadayek Al Ahram",
    "Haram",
    "Imbaba",
    "Mohandseen",
    "Nahia",
    "6th of Oct",
    "Sheikh Zayed",
    "Omraneya",
    "Saft El Laban",
    "Warraq",
    "Alexandria",
    "Asyut",
    "Aswan",
    "Beheira",
    "Beni Suef",
    "Dakahlia",
    "Damietta",
    "Faiyum",
    "Gharbia",
    "Ismailia",
    "Kafr El Sheikh",
    "Luxor",
    "Matruh",
    "Minya",
    "Monufia",
    "El Wadi el Gedid",
    "North Sinai",
    "Port Said",
    "Qalyubia",
    "Qena",
    "El Bahr El Ahmar",
    "Sharqia",
    "Sohag",
    "South Sinai",
    "Suez",
    "Al Amiriyyah",
    "Al Abageyah",
    "Tura",
    "El Hawamdeyya",
    "Al Badrashin",
    "El Hadba EL wosta",
    "Al Ayat",
    "El Saf",
    "Ghamra",
    "El Zaher",
    "Abbaseya",
    "Al Sharabiya",
    "Rod El Farag",
    "Al Khusus",
    "El Zawya El Hamra",
    "Awal Shubra Al Kheimah",
    "Shubra El Kheima 2",
    "Future City",
    "New Heliopolis City",
    "El Obour City",
    "10th of Ramadan",
    "Ard El Lewa",
    "Al Baragel",
    "Al Moatamadeyah",
    "Kafr Hakim",
    "Ossim",
    "El Giza",
    "Al Munib",
    "Saqiyet Mekki",
    "Abu an Numros",
    "Shubra Ment",
    "Al Manawat",
    "Nazlet El Semman",
    "Nazlet Al Batran",
    "El Talbia",
    "Kafr Tuhurmis",
    "Kafr Nassar",
    "Abou Rawash",
    "Elsayeda Aisha",
    "Izbat an Nakhl",
    "CFC",
    "North Coast",
  ];

  render() {
    // console.log(`render orders-->${this.state.orders}`);
    return (
      <div>
        
        {this.state.processing?(
          <div>
            <ProgressBar progress={(this.state.currentlyFulfilledOrder/this.state.totalOrdersToFulfilling)*100} />
            Fulfilled Orders: {this.state.currentlyFulfilledOrder} / {this.state.totalOrdersToFulfilling}
          </div>
        ):(
          <div></div>
        )}
        {this.state.fulfillmentResult.isFulfillmentRequested ? (
          <div>
            
            {this.state.fulfillmentResult.isError ? (
              <Banner title="Something Went Wrong..." status="critical">
                <p> {this.state.fulfillmentResult.Message} </p>
              </Banner>
            ) : (
              <Banner
                title={this.state.fulfillmentResult.Message}
                status="success"
                action={{
                  content: "Print AWB",
                  onAction: () => {
                    Router.push(
                      {
                        pathname: "/pdf",
                        query: { awbList: this.state.fulfillmentResult.AWB },
                      },
                      "/pdf"
                    );
                  },
                }}
              ></Banner>
            )}
          </div>
        ) : (
          <div> </div>
        )}
        <Card>
          
          {this.state.failedToFetchZones ? (
            <InlineError message="Some Zones couldn't be recognized, please select zones manually" />
          ) : (
            <div> </div>
          )}
          {this.state.selectedOrdersNotReady ? (
            <InlineError message="Some Orders are not ready for shipment" />
          ) : (
            <div> </div>
          )}
          <Button
            plain
            onClick={() => this.loadOrders(this.state.nextPageUrl, false)}
          >
            Load More{" "}
          </Button>
          <ResourceList
            resourceName={{ singular: "order", plural: "orders" }}
            items={this.state.orders.map((order) => {
              return {
                id: order.id,
                url: `order/${order.id}`,
                name: order.name,
                created_at: order.created_at,
                current_total_price: order.current_total_price,
                total_outstanding: order.total_outstanding,
                line_items: order.line_items,
                shipping_address: order.shipping_address,
                tags: order.tags,
                refunds: order.refunds,
                current_line_items : order.current_line_items
              };
            })}
            selectedItems={this.state.selectedOrders}
            promotedBulkActions={[
              {
                content: "Fulfill Orders",
                disabled: this.state.processing,
                onAction: async () => {
                  let selectedOrdersIds = this.state.selectedOrders;

                  let selectedOrders = selectedOrdersIds.map(orderId=>{
                    return this.state.orders.find(order=>order.id == orderId)
                  });

                  console.log()

                  // let selectedOrders = this.state.orders.filter((order) =>
                  //   selectedOrdersIds.includes(order.id)
                  // );

                  await this.startFulfillmentProcess(selectedOrders);
                },
              },
            ]}
            onSelectionChange={this.setSelectedOrders}
            renderItem={(item) => {
              const {
                id,
                url,
                name,
                created_at,
                current_total_price,
                total_outstanding,
                line_items,
                shipping_address,
                tags,
                refunds,
                current_line_items
              } = item;
              const { address1 } = shipping_address
                ? shipping_address
                : { address1: "" };

                // const refunded_line_items = refunds
                // .map((refund) =>refund.refund_line_items).flat(2);
      
      
                // let current_line_items = line_items.filter((line_item) => {
                //     let refunded_line_item = refunded_line_items.find(refund_item=>refund_item.line_item_id == line_item.id);
                //     if(refunded_line_item && refunded_line_item.quantity == line_item.quantity){
                //       return false
                //     }
                //     return true;
                //   }
                // ).map(line_item=>{
                //   let refunded_line_item = refunded_line_items.find(refund_item=>refund_item.line_item_id == line_item.id);
                //   if(refunded_line_item){
                //     line_item["quantity"] = line_item.quantity - refunded_line_item.quantity;
                //     return line_item
                //   }
                //   return line_item;
                // });
                // current_line_items = [];

              // this.log(name,current_line_items);


              return (
                <ResourceItem id={id}>
                  <Stack vertical>
                    <Stack>
                      <Stack.Item>
                        <Button
                          plain
                          onClick={(e) => {
                            this.viewOrderDetails(url);
                          }}
                        >
                          <Heading> Order {name} </Heading>
                        </Button>
                      </Stack.Item>
                      <Stack.Item>
                        <TextStyle>      
                          {format(new Date(created_at), "dd/MM/yyyy p")}
                        </TextStyle>
                      </Stack.Item>
                      <Stack.Item fill>
                        <TextStyle> 
                          {total_outstanding}
                        </TextStyle>
                      </Stack.Item>
                      {this.state.failedToFetchZones &&
                      this.state.previousFailedOrder.includes(id) ? (
                        <Stack>
                          <Stack.Item>
                            <Select
                              id={id}
                              options={this.state.citiesOptions}
                              onChange={(e) => this.selectCity(e, id)}
                              value={
                                this.state.selectedCities[id]
                                  ? this.state.selectedCities[id]
                                  : ""
                              }
                              placeholder="Select City"
                            />
                          </Stack.Item>
                          <Stack.Item>
                            <Select
                              id={id}
                              disabled= {!this.state.selectedNeighborhood[id].isCitySelected}
                              options={this.state.selectedNeighborhood[id].neighborhoodOptions}
                              onChange={(e) => this.selectNeighborhood(e, id)}
                              value={
                                this.state.selectedNeighborhood[id].neighborhood
                                  ? this.state.selectedNeighborhood[id]
                                      .neighborhood
                                  : ""
                              }
                              placeholder="Select Zone"
                            />
                          </Stack.Item>
                        </Stack>
                      ) : (
                        <div> </div>
                      )}
                      <Stack.Item>
                        {this.validateOrder(id) ? (
                          <Badge status="success">Ready</Badge>
                        ) : (
                          <Stack vertical>
                            <Badge status="critical">Not Ready</Badge>
                            <InlineError
                              message={
                                this.state.selectedNeighborhood[id]
                                  .readyForShipmentMessage
                              }
                            />
                          </Stack>
                        )}
                      </Stack.Item>
                      <Stack.Item>
                        <Button
                          primary
                          onClick={() => this.fulfillByyMylerz(id)}
                        >
                          
                          Fulfill by Mylerz
                        </Button>
                      </Stack.Item>
                    </Stack>
                    <Stack>
                      <Stack.Item fill>
                        <TextStyle> {address1} </TextStyle>
                      </Stack.Item>
                    </Stack>
                    <Stack>
                  <Stack.Item fill>
                    <ExceptionList
                      items={current_line_items.map((lineItem) => {
                        return {
                          description: `Title: ${lineItem.title},  Quantity: ${lineItem.quantity}`,
                        };
                      })}
                    />
                  </Stack.Item>
                  <Stack.Item>
                    <ExceptionList
                      items={tags.split(",").map((tag) => {
                        return { description: `${tag}` };
                      })}
                    />
                  </Stack.Item>
                </Stack>
                  </Stack>
                </ResourceItem>
              );
            }}
            loading={this.state.processing}
            filterControl={
              <Filters
                queryValue={this.state.queryValue}
                queryPlaceholder="Filter Orders"
                filters={[]}
                onQueryChange={this.handleFiltersQueryChange}
                onQueryClear={this.handleQueryValueRemove}
                onClearAll={this.handleFiltersClearAll}
              />
            }
            hasMoreItems
          ></ResourceList>
          <Button
            plain
            onClick={() => this.loadOrders(this.state.nextPageUrl, false)}
          >
            Load More
          </Button>
        </Card>
        <Modal
          open={this.state.activeModal}
          onClose={() => this.closeModal()}
          title="Select Warehouse"
          primaryAction={{
            content: "Fulfill",
            onAction: () => {
              this.fulfill(this.state.selectedOrders);
            },
          }}
          secondaryActions={[
            {
              content: "Close",
              onAction: () => this.closeModal(),
            },
          ]}
          >
          <Modal.Section>
            <Select
              options={this.context.warehouseOptions}
              onChange={(e) => {
                this.setState(() => {
                  return { selectedWarehouseForBulk: e };
                });
              }}
              value={this.state.selectedWarehouseForBulk}
            ></Select>
          </Modal.Section>
        </Modal>
      </div>
    );
  }
  onPageChange = (activePagee) => {
    // console.log(activePage);
    this.setState(() => {
      return { activePage: activePagee };
    });

    if (this.state.activePage == this.state.numberOfPages) {
    }
  };
  handleFiltersQueryChange = (value) => {
    // console.log("queryChange--->", value);
    this.setState(() => {
      return { queryValue: value };
    });
    if (value !== "") {
      this.setState((state) => {
        return {
          orders: state.allOrders.filter(
            (order) =>
              order.name.includes(value) ||
              order.created_at.includes(value) ||
              order.total_outstanding.includes(value) ||
              (order.shipping_address
                ? order.shipping_address.address1.includes(value)
                : false) ||
              order.line_items
                .map((item) => item.title)
                .join()
                .includes(value) ||
              order.tags.includes(value)
          ),
        };
      });
    } else {
      this.setState((state) => {
        return { orders: state.allOrders };
      });
    }
  };
  handleQueryValueRemove = () => {
    this.setState(() => {
      return { queryValue: null };
    });
    this.setState((state) => {
      return { orders: state.allOrders };
    });
  };
  handleFiltersClearAll = () => {
    this.setState(() => {
      return { queryValue: null };
    });
    this.setState((state) => {
      return { orders: state.allOrders };
    });
  };

  selectNeighborhood(neighborhood, id) {
    // console.log(`neighborhood: ${neighborhood}`);
    this.setState((state) => {
      let neighborhoods = state.selectedNeighborhood;
      neighborhoods[id].neighborhood = neighborhood;

      return { selectedNeighborhood: neighborhoods };
    });
  }
  selectCity(city, id) {
    // console.log(`city: ${city}`);

    this.setState((state) => {
      let cities = state.selectedCities;
      let neighborhoods = state.selectedNeighborhood;
      cities[id] = city;
      if(state.cityZoneObject[city].length != 1){
        neighborhoods[id].neighborhood = "";
      }else{
        neighborhoods[id].neighborhood = state.cityZoneObject[city][0].value;
      }
      neighborhoods[id].neighborhoodOptions = state.cityZoneObject[city];
      neighborhoods[id].isCitySelected = true;
      

      return {
        selectedCities: cities,
        selectedNeighborhood: neighborhoods,
      };
    });
  }
  viewOrderDetails(url) {
    Router.push(url);
  }

  getZones = async (addressList) => {
    let response = await fetch("api/getZones", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        addressList: addressList,
        token: Cookies.get("access_token"),
      }),
    });

    let result = await response.json();

    // console.log(result);
    if (result.status === "success") {
      return result.Zones;
    } else {
      return [];
    }
  };

  
  getWarehouses = async () => {
    let response = await fetch("api/warehouses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        token: Cookies.get("access_token"),
      }),
    });

    let result = await response.json();
    //console.log(result);

    if (result.status === "success") {
      return result.Warehouses;
    } else if (
      result.Error == "Authorization has been denied for this request."
    ) {
      // Cookies.remove("access_token",{ path: '/', domain: 'mylerzshopifyapp.softecinternational.com' })
      // Cookies.set("access_token", new Date(1996,1))
      // //console.log(Cookies.get("access_token"))
      Router.push("/login");
      // Router.reload()
    } else {
      return [];
    }
  };


  getCityZoneList = async () => {
    let response = await fetch("api/getCityZoneList");

    let result = await response.json();

    if (result.status === "success") {
      let citiesOp = result.Cities.map((city) => {
        return { label: city["EnName"], value: city["EnName"] };
      });
      let cityNeighborhoodObject = this.ProcessCityZoneList(result);
      this.setState(() => {
        return {
          cityZoneObject: cityNeighborhoodObject,
          citiesOptions: citiesOp,
        };
      });
    }
  };

  ProcessCityZoneList = (result) => {
    let cityNeighborhoodObject = {};
    result.Cities.forEach((city) => {
      let zoneObject = city["Zones"].map((zone) => {
        return { label: zone["EnName"], value: zone["Code"] };
      });
      cityNeighborhoodObject[city["EnName"]] = zoneObject;
    });

    return cityNeighborhoodObject;
  };

  missingZones = (selectedOrders) => {
    debugger;
    return selectedOrders.some((order) => !order.shipping_address.city);
  };

  loadOrders = async (url, isFirstCall) => {
    if (url) {
      this.setState(() => {
        return {
          processing: true,
        };
      });

      let param = {
        param: "fulfillment_status",
        value: "unfulfilled",
        url: url,
      };
      let response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(param),
      });
      const result = await response.json();
      // console.log(result);
      result.data.orders = result.data.orders.filter(
        (order) => order.fulfillment_status != "fulfilled"
      );

      let neighborhoods = {};
      result.data.orders.forEach((order) => {
        neighborhoods[order.id] = this.getOrderState(order);
      });


      let newOrders = result.data.orders.map((order) => {
        // let refunded_line_items = order.refunds
        //   .map((refund) =>refund.refund_line_items.map(
        //       (refund_line_item) => refund_line_item.line_item
        //     )
        //   )
        //   .flat(2);
        // let current_line_items = order.line_items.filter(
        //   (line_item) =>
        //     !refunded_line_items.map((item) => item.id).includes(line_item.id)
        // );

        let refunded_line_items = order.refunds
          .map((refund) =>refund.refund_line_items).flat(2);


          let current_line_items = order.line_items.filter((line_item) => {
              let refunded_line_item = refunded_line_items.find(refund_item=>refund_item.line_item_id == line_item.id);
              if(refunded_line_item && refunded_line_item.quantity == line_item.quantity){
                return false
              }
              return true;
            }
          ).map(line_item=>{
            let refunded_line_item = refunded_line_items.find(refund_item=>refund_item.line_item_id == line_item.id);
            if(refunded_line_item){
              line_item["quantity"] = line_item.quantity - refunded_line_item.quantity;
              return line_item
            }
            return line_item;
          });
        // this.log(order.name,current_line_items);
        
        order["current_line_items"] = current_line_items;

        return order;
      });

      if (isFirstCall) {
        this.setState((state) => {
          return {
            orders: newOrders,
            nextPageUrl: result.data.nextLink,
            allOrders: newOrders,
            processing: false,
            selectedNeighborhood: neighborhoods,
          };
        });
      } else {
        this.setState((state) => {
          return {
            orders: state.orders.concat(...newOrders),
            nextPageUrl: result.data.nextLink,
            allOrders: state.allOrders.concat(...newOrders),
            processing: false,
            selectedNeighborhood: {
              ...state.selectedNeighborhood,
              ...neighborhoods,
            },
          };
        });
      }

      // let newOrders = this.state.orders.map((order) => {
      //   let refunded_line_items = order.refunds
      //     .map((refund) =>
      //       refund.refund_line_items.map(
      //         (refund_line_item) => refund_line_item.line_item
      //       )
      //     )
      //     .flat(2);

      //   let current_line_items = order.line_items.filter(
      //     (line_item) =>
      //       !refunded_line_items.map((item) => item.id).includes(line_item.id)
      //   );

      //   order["current_line_items"] = current_line_items;

      //   return order;
      // });

      ////console.log("new Orders ", newOrders);

      // this.setState(() => {
      //   return { orders: newOrders };
      // });
    }
  };

  setSelectedOrders = (selectedOrders) => {
    this.setState(() => {
      return { selectedOrders: selectedOrders };
    });

    let orderItemWarehouse = this.state.orders
      .filter((order) => selectedOrders.includes(order.id))
      .map((order) => {
        return order.current_line_items
          .filter(
            (item) =>
              !this.context.orderItemWarehouse
                .map((orderItem) => orderItem.itemId)
                .includes(item.variant_id)
          )
          .map((item) => {
            return {
              orderId: order.id,
              itemId: item.variant_id,
              warehouse: "",
              orderName: order.name,
            };
          });
      })
      .flat(Infinity);

    this.context.updateOrderItemWarehouse(orderItemWarehouse);


  };

  async componentDidMount() {
    let warehouses = await this.getWarehouses();

    if (warehouses.length == 1) {
      this.setState(() => {
        return { selectedWarehouseForBulk: warehouses[0] };
      });

      this.setState(() => {
        return { isSingleWarehouse: true };
      });
    }

    let warehouseOptions = [
      { label: "Select Warehouse", value: "", disabled: true },
    ];

    warehouseOptions = [
      ...warehouseOptions,
      ...warehouses.map((warehouse) => {
        return { label: warehouse, value: warehouse };
      }),
    ];

    this.context.updateWarehouseOptions(warehouseOptions);


    this.setState(() => {
      return {
        firstPageUrl: `https://${Cookies.get(
          "shopOrigin"
        )}/admin/api/2022-01/orders.json?fulfillment_status=unfulfilled&limit=150`,
      };
    });

    this.getCityZoneList();

    await this.loadOrders(
      `https://${Cookies.get(
        "shopOrigin"
      )}/admin/api/2022-01/orders.json?fulfillment_status=unfulfilled&limit=150`,
      true
    );

    let neighborhoods = {};
    this.state.orders.forEach((order) => {
      neighborhoods[order.id] = this.getOrderState(order);
    });

    let cities = {};
    this.state.orders.forEach((order) => {
      cities[order.id] = null;
    });

    this.setState(() => {
      return {
        selectedNeighborhood: neighborhoods,
        selectedCities: cities,
      };
    });
  }

  fulfillOrders = async (ordersList, orderItemWarehouseList) => {
    this.log("fulfillOrders 1: ",ordersList)
    
    
    let data = { 
      orders: ordersList,
       token: Cookies.get("access_token"),
       orderItemWarehouseList: orderItemWarehouseList,
      };
    let response = await fetch(`api/order/fulfill/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    let result = await response.json();

    return result;
  };

  markOrderAsFulfilled = async (order,barcodes) => {
    // console.log(`barcode in mark ${barcodes}`)
    let data = { order: order, barcodes:barcodes, token: Cookies.get("access_token") };
    let response = await fetch(`api/order/markAsFulfilled/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    let result = await response.json();

    return result;
  };

  startFulfillmentProcess = async (selectedOrders) => {

      let addressList = selectedOrders.map((order) =>
        order.shipping_address ? order.shipping_address.address1 : ""
      );

      let addressZoneList = await this.getZones(addressList);

      this.log("startFulfillmentProcess 1: ",selectedOrders)

      // console.log("startFulfillmentProcess 1: " + JSON.stringify(selectedOrders));

      selectedOrders.forEach((order, index) => {
        order.closed_at = new Date();

        order.shipping_address
          ? (order.shipping_address.city = addressZoneList[index].m_Item2)
          : (order.shipping_address = {
              city: addressZoneList[index].m_Item2,
              address1: "",
            });

        if (!order.shipping_address.city) {
          order.shipping_address.city = this.state.selectedNeighborhood[
            order.id
          ].neighborhood
            ? this.state.selectedNeighborhood[order.id].neighborhood
            : null;
        }
      });

      this.log("startFulfillmentProcess 2: ",selectedOrders)

      // console.log("startFulfillmentProcess 2: " + JSON.stringify(selectedOrders));

      if (this.missingZones(selectedOrders)) {
        let previouseSelectedOrders = this.state.selectedOrders;
        this.setState((prevState) => {
          // debugger
          return {
            failedToFetchZones: true,
            previousFailedOrder: [
              ...new Set([
                ...prevState.previousFailedOrder,
                ...selectedOrders
                  .filter((order) => !order.shipping_address.city)
                  .map((order) => order.id),
              ]),
            ],
            selectedOrders: [],
          };
        });
        this.setState(() => {
          // debugger
          return { selectedOrders: previouseSelectedOrders };
        });
        // this.forceUpdate();
        // console.log(this.state.previousFailedOrder);
      } else {
        let doesAllItemsHasWarehouse = this.checkItemWarehouse(selectedOrders);

        if (this.state.isSingleWarehouse || doesAllItemsHasWarehouse) {
        let selectedOrderIds = selectedOrders.map(order=>order.id);
        
      this.log("startFulfillmentProcess 3: ",selectedOrders)

        // console.log("startFulfillmentProcess 3: " + JSON.stringify(selectedOrders));

        this.fulfill(selectedOrderIds);
      } else {
        this.openModal();
      }
        
      }

      
  };

  getAWB = async (trackingNumbers)=>{
    trackingNumbers = [...new Set(trackingNumbers)]
    let data = { trackingNumbers: trackingNumbers, token: Cookies.get("access_token") };
    let response = await fetch(`api/getAWB/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    let result = await response.json();

    return result;
  }

  async fulfillByyMylerz(id) {
    const order = this.state.orders.find((order) => order.id == id);
    // console.log(order);

    this.log("fulfillByyMylerz 1: ",order)

    this.setSelectedOrders([id])

    this.log("fulfillByyMylerz 2: ",order)

    // console.log("fulfillByyMylerz 2: " + JSON.stringify(order));
    await this.startFulfillmentProcess([order]);
  }

  afterFulfillSuccess(fulfilledOrders) {
    let selectedOrdersIds = this.state.selectedOrders.map((order) => order.id);
    let newOrders = this.state.orders.filter(
      (order) => !selectedOrdersIds.includes(order.id)
    );
    let neighborhoods = {};
    newOrders.forEach((order) => {
      neighborhoods[order.id].neighborhood = "";
    });

    this.setState(() => {
      return {
        orders: newOrders,
        nextPageUrl: result.data.nextLink,
        allOrders: newOrders,
        processing: false,
        selectedNeighborhood: neighborhoods,
      };
    });
  }

  validateOrder(id) {
    let order = this.state.selectedNeighborhood[id];
    // console.log("Order Status: "+order);
    let isReady = order.readyForShipmentStatus;
    return isReady;
  }
  getOrderState = (order) => {
    if (!order.shipping_address || !order.shipping_address?.address1) {
      return {
        neighborhood: null,
        isCitySelected:false,
        readyForShipmentStatus: false,
        readyForShipmentMessage: "missing shipping address",
      };
    } else if (!order.customer) {
      return {
        neighborhood: null,
        isCitySelected:false,
        readyForShipmentStatus: false,
        readyForShipmentMessage: "missing customer",
      };
    } else if (!order.shipping_address?.phone && !order.customer?.phone) {
      return {
        neighborhood: null,
        isCitySelected:false,
        readyForShipmentStatus: false,
        readyForShipmentMessage: "missing phone number",
      };
    }  else if (!order.shipping_address.address1) {
      return {
        neighborhood: null,
        isCitySelected:false,
        readyForShipmentStatus: false,
        readyForShipmentMessage: "missing customer name",
      };
    } else {
      return {
        neighborhood: null,
        isCitySelected:false,
        readyForShipmentStatus: true,
        readyForShipmentMessage: "ready for shipment",
      };
    }
  };
  openModal() {
    // ////console.log("in openModal");
    this.setState(() => {
      return { activeModal: true };
    });
  }
  closeModal() {
    this.setState(() => {
      return { activeModal: false };
    });

    this.setSelectedOrders([]);
  }

  stampWarehouseToItem(selectedOrders) {
    selectedOrders.forEach((order) =>
      order.current_line_items.forEach((item) => {
        let orderItem = this.context.orderItemWarehouse.find(
          (orderItem) =>
            orderItem.orderId == order.id &&
            orderItem.itemId == item.variant_id &&
            orderItem.warehouse != ""
        );

        item["warehouse"] = orderItem
          ? orderItem.warehouse
          : this.state.selectedWarehouseForBulk;
      })
    );
    return selectedOrders;
  }
  checkItemWarehouse(selectedOrders) {
    let itemsWithNoWarehouse = selectedOrders
      .map((order) => {
        return order.current_line_items.map((item) => {
          return this.context.orderItemWarehouse.filter(
            (orderItem) =>
              orderItem.orderId == order.id &&
              orderItem.itemId == item.variant_id &&
              orderItem.warehouse == ""
          );
        });
      })
      .flat(2);

    if (itemsWithNoWarehouse.length > 0) return false;
    else return true;
  }
  async fulfill(selectedOrdersIds) {
    this.closeModal();

    this.log("fulfill 1: ",selectedOrdersIds)

    // console.log("fulfill 1: " + JSON.stringify(selectedOrdersIds));


    let ordersAreReady = selectedOrdersIds.every((orderId) =>
      this.validateOrder(orderId)
    );


    if (selectedOrdersIds.length && ordersAreReady) {
      this.setState(() => {
        return { 
          processing: true,
          selectedOrdersNotReady: false,
          currentlyFulfilledOrder:0,
          totalOrdersToFulfilling: selectedOrdersIds.length };
      });

      // let selectedOrders = this.state.orders.filter((order) =>
      //   selectedOrdersIds.includes(order.id)
      // );
      let selectedOrders = selectedOrdersIds.map(orderId=>{
        return this.state.orders.find(order=>order.id == orderId)
      });

      this.log("fulfill 2: ",selectedOrders)

      // console.log("fulfill 2: " + JSON.stringify(selectedOrders));

      selectedOrders = this.stampWarehouseToItem(selectedOrders);

      this.log("fulfill 3: ",selectedOrders)
      
      // console.log("fulfill 3: " + JSON.stringify(selectedOrders));

      let result = await this.fulfillOrders(
        selectedOrders,
        this.state.orderItemWarehouse
      );
      this.setState(() => {
        return { failedToFetchZones: false };
      });

      if (result.status == "success") {

        console.log(result)

        let markResult = []
        
        for (let index = 0; index < selectedOrders.length; index++) {
          console.log(`barcode after fulfillment ${result.Barcodes}`);
          let res  = await this.markOrderAsFulfilled(selectedOrders[index],result.Barcodes);

          markResult.push(res);

          this.setState((state) => {return { currentlyFulfilledOrder:state.currentlyFulfilledOrder +1 }; });

          console.log(res);
          
        }

        let barcodeList = result.Barcodes.map(tuple=>tuple.Item2)

        let awbResult = await this.getAWB(barcodeList);

        if(awbResult.status == "success"){
          
          this.setState(() => {
            return {
              fulfillmentResult: {
                isFulfillmentRequested: true,
                isError: false,
                Message: awbResult.Message,
                AWB: awbResult.AWB,
              },
            };
          });
        await this.loadOrders(this.state.firstPageUrl, true);


        }else{

          this.setState(() => {
            return {
              fulfillmentResult: {
                isFulfillmentRequested: true,
                isError: true,
                Message: awbResult.Message,
                AWB: null,
              },
            };
          });

        }

      } else {
        this.setState(() => {
          return {
            fulfillmentResult: {
              isFulfillmentRequested: true,
              isError: true,
              Message: result.Message,
              AWB: null,
            },
          };
        });
      }

      this.setState(() => {
        return {
          processing: false,
          currentlyFulfilledOrder:0,
          totalOrdersToFulfilling: 0
        };
      });

    } else {
      this.setState(() => {
        return { selectedOrdersNotReady: true };
      });
    }
  }
  log(methodname , object){
    console.log(methodname +  " :");
    console.log(object);
  }
}

export default OrdersList;
