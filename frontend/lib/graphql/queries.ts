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
  }
`;

