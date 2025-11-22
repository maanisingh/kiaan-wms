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
      productId
      warehouseId
      locationId
      lotNumber
      batchNumber
      serialNumber
      bestBeforeDate
      receivedDate
      quantity
      availableQuantity
      reservedQuantity
      status
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_INVENTORY = gql`
  mutation UpdateInventory($id: String!, $set: Inventory_set_input!) {
    update_Inventory_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      productId
      warehouseId
      locationId
      lotNumber
      batchNumber
      serialNumber
      bestBeforeDate
      quantity
      availableQuantity
      reservedQuantity
      status
      updatedAt
    }
  }
`;

export const DELETE_INVENTORY = gql`
  mutation DeleteInventory($id: String!) {
    delete_Inventory_by_pk(id: $id) {
      id
      lotNumber
    }
  }
`;

export const ADJUST_INVENTORY = gql`
  mutation AdjustInventory($id: String!, $quantity: Int!) {
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
// BUNDLE ITEM MUTATIONS
// ============================================

export const CREATE_BUNDLE_ITEM = gql`
  mutation CreateBundleItem($object: BundleItem_insert_input!) {
    insert_BundleItem_one(object: $object) {
      id
      parentId
      childId
      quantity
      createdAt
    }
  }
`;

export const UPDATE_BUNDLE_ITEM = gql`
  mutation UpdateBundleItem($id: String!, $set: BundleItem_set_input!) {
    update_BundleItem_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      parentId
      childId
      quantity
    }
  }
`;

export const DELETE_BUNDLE_ITEM = gql`
  mutation DeleteBundleItem($id: String!) {
    delete_BundleItem_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_BUNDLE_ITEMS_BY_PARENT = gql`
  mutation DeleteBundleItemsByParent($parentId: String!) {
    delete_BundleItem(where: { parentId: { _eq: $parentId } }) {
      affected_rows
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
      type
      orderId
      assignedUserId
      status
      priority
      enforceSingleBBDate
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PICK_LIST = gql`
  mutation UpdatePickList($id: String!, $set: PickList_set_input!) {
    update_PickList_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      pickListNumber
      type
      orderId
      assignedUserId
      status
      priority
      enforceSingleBBDate
      updatedAt
    }
  }
`;

export const DELETE_PICK_LIST = gql`
  mutation DeletePickList($id: String!) {
    delete_PickList_by_pk(id: $id) {
      id
      pickListNumber
    }
  }
`;

export const CREATE_PICK_ITEM = gql`
  mutation CreatePickItem($object: PickItem_insert_input!) {
    insert_PickItem_one(object: $object) {
      id
      pickListId
      productId
      locationId
      selectedBBDate
      lotNumber
      quantityRequired
      quantityPicked
      status
      sequenceNumber
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PICK_ITEM = gql`
  mutation UpdatePickItem($id: String!, $set: PickItem_set_input!) {
    update_PickItem_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      pickListId
      productId
      locationId
      quantityRequired
      quantityPicked
      status
      sequenceNumber
      updatedAt
    }
  }
`;

export const DELETE_PICK_ITEM = gql`
  mutation DeletePickItem($id: String!) {
    delete_PickItem_by_pk(id: $id) {
      id
    }
  }
`;

export const COMPLETE_PICK_LIST = gql`
  mutation CompletePickList($id: String!, $completedAt: String!) {
    update_PickList_by_pk(
      pk_columns: { id: $id }
      _set: { status: "COMPLETED", completedAt: $completedAt, updatedAt: $completedAt }
    ) {
      id
      pickListNumber
      status
      completedAt
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

// ============================================
// SUPPLIER MUTATIONS
// ============================================

export const CREATE_SUPPLIER = gql`
  mutation CreateSupplier($object: Supplier_insert_input!) {
    insert_Supplier_one(object: $object) {
      id
      name
      code
      email
      phone
      address
      companyId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_SUPPLIER = gql`
  mutation UpdateSupplier($id: String!, $set: Supplier_set_input!) {
    update_Supplier_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      name
      code
      email
      phone
      address
      updatedAt
    }
  }
`;

export const DELETE_SUPPLIER = gql`
  mutation DeleteSupplier($id: String!) {
    delete_Supplier_by_pk(id: $id) {
      id
      name
      code
    }
  }
`;

// ============================================
// BRAND MUTATIONS
// ============================================

export const CREATE_BRAND = gql`
  mutation CreateBrand($object: Brand_insert_input!) {
    insert_Brand_one(object: $object) {
      id
      name
      code
      description
      companyId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_BRAND = gql`
  mutation UpdateBrand($id: String!, $set: Brand_set_input!) {
    update_Brand_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      name
      code
      description
      updatedAt
    }
  }
`;

export const DELETE_BRAND = gql`
  mutation DeleteBrand($id: String!) {
    delete_Brand_by_pk(id: $id) {
      id
      name
      code
    }
  }
`;

// ============================================
// LOCATION MUTATIONS
// ============================================

export const CREATE_LOCATION = gql`
  mutation CreateLocation($object: Location_insert_input!) {
    insert_Location_one(object: $object) {
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
    }
  }
`;

export const UPDATE_LOCATION = gql`
  mutation UpdateLocation($id: String!, $set: Location_set_input!) {
    update_Location_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      name
      code
      warehouseId
      zoneId
      aisle
      rack
      shelf
      bin
      updatedAt
    }
  }
`;

export const DELETE_LOCATION = gql`
  mutation DeleteLocation($id: String!) {
    delete_Location_by_pk(id: $id) {
      id
      name
      code
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
      name
      code
      type
      status
      address
      phone
      capacity
      companyId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_WAREHOUSE = gql`
  mutation UpdateWarehouse($id: String!, $set: Warehouse_set_input!) {
    update_Warehouse_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      name
      code
      type
      status
      address
      phone
      capacity
      updatedAt
    }
  }
`;

export const DELETE_WAREHOUSE = gql`
  mutation DeleteWarehouse($id: String!) {
    delete_Warehouse_by_pk(id: $id) {
      id
      name
      code
    }
  }
`;
