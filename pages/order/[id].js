import React, { useState, useEffect, useContext } from "react";
import {
  Stack,
  Button,
  Page,
  ResourceList,
  ResourceItem,
  TextStyle,
  Select,
} from "@shopify/polaris";
import withAuth from "../../components/withAuth";
import  warehouseContext  from '../../components/warehouseContext'


import { useRouter } from "next/router";

const Order = (props) => {
  const router = useRouter();
  const { orderItemWarehouse, updateOrderItemWarehouse, warehouseOptions, updateWarehouseOptions} = useContext(warehouseContext)
  const { id } = router.query;
  const [order, setOrder] = useState({});
  const [loading, setLoading] = useState(true);
  const [lineItems, setLineItems] = useState([]);
  // const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouses, setSelectedWarehouses] = useState([]);

  // const options = [
  //   { label: "Select Warehouse", value: "" },
  //   { label: "Maadi", value: "Maadi" },
  //   { label: "Nasr City", value: "Nasr City" },
  // ];

  const selected = [];

  useEffect(() => {
    const getOrderAsync = async (id) => {
      await getOrder(id);
    };
    if (id) {
      getOrderAsync(id);
    }
  }, [id]);

  // useEffect(()=>{
  //   console.log("orderItemwarehousre from order",orderItemWarehouse);


  // })

  const getOrder = async (orderId) => {
    let response = await fetch("/api/order", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        id: orderId,
      }),
    });

    let result = await response.json();

    if (result.status == "success") {
      console.log(result.data.order);
      setOrder(result.data.order);
      let line_items = result.data.order.line_items;
      
      let refunded_line_items = result.data.order.refunds
      .map((refund) =>
        refund.refund_line_items.map(
          (refund_line_item) => refund_line_item.line_item
        )
      )
      .flat(2);

    let current_line_items = line_items.filter(
      (line_item) =>
        !refunded_line_items
          .map((item) => item.id)
          .includes(line_item.id)
    );
    
    let initselectedwarehouses = current_line_items.map(lineItem=>{
      let orderItem = orderItemWarehouse.find(row=>(row.orderId == orderId) && (row.itemId == lineItem.variant_id))

      return  orderItem ? {orderId:orderId, itemId:lineItem.variant_id, warehouse: orderItem.warehouse, orderName:result.data.order.name}:
       {orderId:orderId, itemId:lineItem.variant_id,  orderName:result.data.order.name, warehouse:"" }
      
    })
      setLineItems(current_line_items);
      setSelectedWarehouses(initselectedwarehouses);
      setLoading(false)
    } 
  };

  const changeHandler = (warehouse, id) => {
    console.log(id);
    let warehousesArray = [...selectedWarehouses];
    let index = warehousesArray.findIndex(warehouse=>warehouse.itemId == id)
    warehousesArray[index].warehouse = warehouse
    setSelectedWarehouses(warehousesArray);
    updateOrderItemWarehouse(selectedWarehouses)

    // console.log(warehousesArray)
  };

  const back = ()=>{
    // updateOrderItemWarehouse(selectedWarehouses)
    
    router.push("/");
  }

  return (
    <Page>
      <Button
        onClick={() => { back()}}
      >
        Back
      </Button>

      <ResourceList
        // resourceName={{ singular: 'line_item', plural: 'line_items' }}
        items={lineItems}
        loading={loading}
        renderItem={(item) => {
          const { variant_id, title, quantity } = item;
          return (
            <ResourceItem id={variant_id}>
              <Stack>
                <Stack.Item fill>
                  <Stack vertical >
                    <TextStyle>Title: {title}</TextStyle>
                    <TextStyle>Quantity: x{quantity}</TextStyle>
                  </Stack>
                </Stack.Item>
                <Stack.Item>
                  <Select
                    options={warehouseOptions}
                    onChange={(e) => {
                      changeHandler(e, variant_id);
                    }}
                    value={selectedWarehouses.find((x) => x.itemId == variant_id)?selectedWarehouses.find((x) => x.itemId == variant_id).warehouse:""}
                    ></Select>
                  </Stack.Item>
              </Stack>
            </ResourceItem>
          );
        }}
      ></ResourceList>
    </Page>
  );
};

export default Order;
