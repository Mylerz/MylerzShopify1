import App from 'next/app';
import Head from 'next/head';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/styles.css'
import translations from '@shopify/polaris/locales/en.json';
import '@shopify/polaris/styles.css';
import { Provider } from '@shopify/app-bridge-react';
import  warehouseContext  from '../components/warehouseContext'
import Cookies from 'js-cookie';
import { AuthProvider } from '../components/withAuth'
import '../styles/print.css'



class MyApp extends App {
   
  state = {
    orderItemWarehouse: [],
    warehouseOptions:[]
  };

  updateOrderItemWarehouse = (orderItemWarehouseList)=>{
    this.setState((state)=>{
      let newOrderItemWarehouseList = [...state.orderItemWarehouse]
      orderItemWarehouseList.map(orderItemWarehouse=>{
        newOrderItemWarehouseList.find(row=>(row.orderId == orderItemWarehouse.orderId) && (row.itemId == orderItemWarehouse.itemId))? newOrderItemWarehouseList.find(row=>(row.orderId == orderItemWarehouse.orderId) && (row.itemId == orderItemWarehouse.itemId)).warehouse = orderItemWarehouse.warehouse:newOrderItemWarehouseList.push(orderItemWarehouse)
      })
      console.log("newOrderItemWarehouseList from _app",newOrderItemWarehouseList)
      return {orderItemWarehouse : newOrderItemWarehouseList}
    })
  }

  setOrderItemWarehouse = (orderItemWarehouse)=>{
    this.setState(()=>{return {orderItemWarehouse: orderItemWarehouse}})
  }

  updateWarehouseOptions = (warehouseOptions)=>{
    this.setState(()=>{
      return {warehouseOptions:warehouseOptions}
    })
  }

  render() {
    const { Component, pageProps } = this.props;
    const config = { apiKey: API_KEY, shopOrigin: Cookies.get('shopOrigin'),accessToken: Cookies.get("accessToken"), forceRedirect: true };

    console.log("in _app Config: ",config)

    return (
      <React.Fragment>
        <Head>
          <title>mylerz</title>
          <meta charSet="utf-8" />
        </Head>
         <Provider config={config}>
          <AppProvider>
            <warehouseContext.Provider value = {{warehouseOptions:this.state.warehouseOptions, updateWarehouseOptions:this.updateWarehouseOptions, orderItemWarehouse: this.state.orderItemWarehouse,updateOrderItemWarehouse: this.updateOrderItemWarehouse, setOrderItemWarehouse:this.setOrderItemWarehouse}}>
              <Component {...pageProps} /> 
            </warehouseContext.Provider>
          </AppProvider>
         </Provider>
      </React.Fragment>
    );
  }
}


export default MyApp;