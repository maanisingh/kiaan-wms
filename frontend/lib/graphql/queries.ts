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
      price
      costPrice
      weight
      dimensions
      status
      type
      isSerialized
      trackBestBefore
      createdAt
      updatedAt
      Brand {
        id
        name
      }
      Inventories {
        id
        quantity
        availableQuantity
        Location {
          code
          Warehouse {
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

export const GET_BRANDS = gql`
  query GetBrands {
    Brand(order_by: { name: asc }) {
      id
      name
      description
      createdAt
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
      Customer {
        id
        name
        email
        phone
      }
      SalesOrderItems {
        id
        quantity
        unitPrice
        Product {
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

