import { gql } from '@apollo/client';

// ============================================
// PRODUCT QUERIES
// ============================================

export const GET_PRODUCTS = gql`
  query GetProducts($limit: Int, $offset: Int, $where: Product_bool_exp) {
    Product(limit: $limit, offset: $offset, where: $where, order_by: { createdAt: desc }) {
      id
      name
      sku
      barcode
      description
      sellingPrice
      costPrice
      weight
      weightUnit
      length
      width
      height
      dimensionUnit
      status
      type
      isPerishable
      requiresBatch
      requiresSerial
      shelfLifeDays
      createdAt
      updatedAt
      brand {
        id
        name
      }
      inventoryItems {
        id
        quantity
        availableQuantity
        location {
          code
          warehouse {
            name
          }
        }
      }
    }
    Product_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_PRODUCT_BY_ID = gql`
  query GetProductById($id: String!) {
    Product_by_pk(id: $id) {
      id
      name
      sku
      barcode
      description
      sellingPrice
      costPrice
      weight
      weightUnit
      length
      width
      height
      dimensionUnit
      status
      type
      isPerishable
      requiresBatch
      requiresSerial
      shelfLifeDays
      images
      createdAt
      updatedAt
      brand {
        id
        name
      }
      inventoryItems {
        id
        quantity
        availableQuantity
        bestBeforeDate
        lotNumber
        location {
          code
          name
          warehouse {
            name
          }
        }
      }
    }
  }
`;

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    Product_aggregate {
      aggregate {
        count
      }
    }
    Inventory_aggregate {
      aggregate {
        count
        sum {
          quantity
          availableQuantity
        }
      }
    }
    SalesOrder_aggregate {
      aggregate {
        count
      }
    }
    Warehouse_aggregate {
      aggregate {
        count
      }
    }
  }
`;

export const GET_INVENTORY = gql`
  query GetInventory($limit: Int, $offset: Int, $where: Inventory_bool_exp) {
    Inventory(limit: $limit, offset: $offset, where: $where, order_by: { createdAt: desc }) {
      id
      quantity
      availableQuantity
      reservedQuantity
      status
      lotNumber
      bestBeforeDate
      serialNumber
      createdAt
      updatedAt
      Product {
        id
        name
        sku
        barcode
      }
      Location {
        id
        code
        name
        Warehouse {
          id
          name
        }
      }
    }
    Inventory_aggregate(where: $where) {
      aggregate {
        count
        sum {
          quantity
          availableQuantity
        }
      }
    }
  }
`;

export const GET_SALES_ORDERS = gql`
  query GetSalesOrders($limit: Int, $offset: Int, $where: SalesOrder_bool_exp) {
    SalesOrder(limit: $limit, offset: $offset, where: $where, order_by: { orderDate: desc }) {
      id
      orderNumber
      orderDate
      totalAmount
      status
      isWholesale
      salesChannel
      priority
      notes
      createdAt
      updatedAt
      customer {
        id
        name
        email
        phone
      }
      salesOrderItems {
        id
        quantity
        unitPrice
        product {
          id
          name
          sku
        }
      }
    }
    SalesOrder_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

// ============================================
// CUSTOMER QUERIES
// ============================================

export const GET_CUSTOMERS = gql`
  query GetCustomers($limit: Int, $offset: Int, $where: Customer_bool_exp) {
    Customer(limit: $limit, offset: $offset, where: $where, order_by: { createdAt: desc }) {
      id
      name
      code
      email
      phone
      address
      customerType
      createdAt
      updatedAt
    }
    Customer_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_CUSTOMER_BY_ID = gql`
  query GetCustomerById($id: String!) {
    Customer_by_pk(id: $id) {
      id
      name
      code
      email
      phone
      address
      customerType
      createdAt
      updatedAt
    }
  }
`;

// ============================================
// SUPPLIER QUERIES
// ============================================

export const GET_SUPPLIERS = gql`
  query GetSuppliers($limit: Int, $offset: Int, $where: Supplier_bool_exp) {
    Supplier(limit: $limit, offset: $offset, where: $where, order_by: { createdAt: desc }) {
      id
      name
      code
      email
      phone
      address
      createdAt
      updatedAt
    }
    Supplier_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_SUPPLIER_BY_ID = gql`
  query GetSupplierById($id: String!) {
    Supplier_by_pk(id: $id) {
      id
      name
      code
      email
      phone
      address
      createdAt
      updatedAt
    }
  }
`;

// ============================================
// BRAND QUERIES
// ============================================

export const GET_BRANDS = gql`
  query GetBrands($limit: Int, $offset: Int, $where: Brand_bool_exp) {
    Brand(limit: $limit, offset: $offset, where: $where, order_by: { name: asc }) {
      id
      name
      code
      description
      createdAt
      updatedAt
    }
    Brand_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_BRAND_BY_ID = gql`
  query GetBrandById($id: String!) {
    Brand_by_pk(id: $id) {
      id
      name
      code
      description
      createdAt
      updatedAt
    }
  }
`;

// ============================================
// LOCATION QUERIES
// ============================================

export const GET_LOCATIONS = gql`
  query GetLocations($limit: Int, $offset: Int, $where: Location_bool_exp) {
    Location(limit: $limit, offset: $offset, where: $where, order_by: { createdAt: desc }) {
      id
      name
      code
      warehouseId
      zoneId
      aisle
      rack
      shelf
      bin
      createdAt
      updatedAt
      warehouse {
        id
        name
        code
      }
    }
    Location_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_LOCATION_BY_ID = gql`
  query GetLocationById($id: String!) {
    Location_by_pk(id: $id) {
      id
      name
      code
      warehouseId
      zoneId
      aisle
      rack
      shelf
      bin
      createdAt
      updatedAt
      warehouse {
        id
        name
        code
      }
    }
  }
`;

// ============================================
// WAREHOUSE QUERIES
// ============================================

export const GET_WAREHOUSES = gql`
  query GetWarehouses($limit: Int, $offset: Int, $where: Warehouse_bool_exp) {
    Warehouse(limit: $limit, offset: $offset, where: $where, order_by: { name: asc }) {
      id
      name
      code
      type
      status
      address
      phone
      capacity
      createdAt
      updatedAt
    }
    Warehouse_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_WAREHOUSE_BY_ID = gql`
  query GetWarehouseById($id: String!) {
    Warehouse_by_pk(id: $id) {
      id
      name
      code
      type
      status
      address
      phone
      capacity
      createdAt
      updatedAt
    }
  }
`;

