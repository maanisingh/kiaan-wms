import { gql } from '@apollo/client';

// ============================================
// PRODUCT MUTATIONS
// ============================================

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($object: Product_insert_input!) {
    insert_Product_one(object: $object) {
      id
      name
      sku
      barcode
      description
      sellingPrice
      costPrice
      status
      type
      weight
      length
      width
      height
      dimensionUnit
      weightUnit
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: String!, $set: Product_set_input!) {
    update_Product_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      name
      sku
      sellingPrice
      costPrice
      status
      type
      description
      updatedAt
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: String!) {
    delete_Product_by_pk(id: $id) {
      id
      name
      sku
    }
  }
`;

// ============================================
// INVENTORY MUTATIONS
// ============================================

export const CREATE_INVENTORY = gql`
  mutation CreateInventory($object: Inventory_insert_input!) {
    insert_Inventory_one(object: $object) {
      id
      quantity
      availableQuantity
      Product {
        name
        sku
      }
      Location {
        code
      }
    }
  }
`;

export const UPDATE_INVENTORY = gql`
  mutation UpdateInventory($id: uuid!, $set: Inventory_set_input!) {
    update_Inventory_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      quantity
      availableQuantity
      status
      updatedAt
    }
  }
`;

export const ADJUST_INVENTORY = gql`
  mutation AdjustInventory($id: uuid!, $quantity: numeric!, $reason: String) {
    update_Inventory_by_pk(
      pk_columns: { id: $id }
      _inc: { quantity: $quantity, availableQuantity: $quantity }
    ) {
      id
      quantity
      availableQuantity
    }
  }
`;

// ============================================
// SALES ORDER MUTATIONS
// ============================================

export const CREATE_SALES_ORDER = gql`
  mutation CreateSalesOrder($object: SalesOrder_insert_input!) {
    insert_SalesOrder_one(object: $object) {
      id
      orderNumber
      orderDate
      status
      totalAmount
      subtotal
      customer {
        id
        name
      }
      salesOrderItems {
        id
        quantity
        unitPrice
      }
    }
  }
`;

export const UPDATE_SALES_ORDER_STATUS = gql`
  mutation UpdateSalesOrderStatus($id: String!, $status: String!) {
    update_SalesOrder_by_pk(pk_columns: { id: $id }, _set: { status: $status, updatedAt: "now()" }) {
      id
      orderNumber
      status
      updatedAt
    }
  }
`;

export const DELETE_SALES_ORDER = gql`
  mutation DeleteSalesOrder($id: String!) {
    delete_SalesOrder_by_pk(id: $id) {
      id
      orderNumber
    }
  }
`;

// ============================================
// PICK LIST MUTATIONS
// ============================================

export const CREATE_PICK_LIST = gql`
  mutation CreatePickList($object: PickList_insert_input!) {
    insert_PickList_one(object: $object) {
      id
      pickListNumber
      status
      SalesOrder {
        orderNumber
      }
    }
  }
`;

export const UPDATE_PICK_ITEM = gql`
  mutation UpdatePickItem($id: uuid!, $pickedQuantity: Int!, $status: String!) {
    update_PickItem_by_pk(
      pk_columns: { id: $id }
      _set: { pickedQuantity: $pickedQuantity, status: $status }
    ) {
      id
      requestedQuantity
      pickedQuantity
      status
    }
  }
`;

export const COMPLETE_PICK_LIST = gql`
  mutation CompletePickList($id: uuid!) {
    update_PickList_by_pk(
      pk_columns: { id: $id }
      _set: { status: "COMPLETED", completedAt: "now()" }
    ) {
      id
      pickListNumber
      status
      completedAt
    }
  }
`;

// ============================================
// WAREHOUSE MUTATIONS
// ============================================

export const CREATE_WAREHOUSE = gql`
  mutation CreateWarehouse($object: Warehouse_insert_input!) {
    insert_Warehouse_one(object: $object) {
      id
      code
      name
      type
      status
    }
  }
`;

export const UPDATE_WAREHOUSE = gql`
  mutation UpdateWarehouse($id: uuid!, $set: Warehouse_set_input!) {
    update_Warehouse_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      name
      updatedAt
    }
  }
`;

// ============================================
// CUSTOMER MUTATIONS
// ============================================

export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($object: Customer_insert_input!) {
    insert_Customer_one(object: $object) {
      id
      name
      code
      email
      phone
      address
      customerType
      companyId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: String!, $set: Customer_set_input!) {
    update_Customer_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      name
      code
      email
      phone
      address
      customerType
      updatedAt
    }
  }
`;

export const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: String!) {
    delete_Customer_by_pk(id: $id) {
      id
      name
      code
    }
  }
`;
