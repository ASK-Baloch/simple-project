import { PRODUCT_CATEGORIES } from "../../config";
import { CollectionBeforeChangeHook, CollectionConfig } from "payload/types";
import { slateEditor } from "@payloadcms/richtext-slate";
import { stripe } from "../../lib/stripe";
import { Product } from "../../payload-types";


const addUser: CollectionBeforeChangeHook = ({ req, data }) => {
  const user = req.user ;
  return { ...data, user: user?.id };
};



export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "name",
  },
  access: {}, 
  hooks: {
    beforeChange: [addUser, async (args) => {
      if (args.operation === "create") {
        const data = args.data as Product
        const createProduct = await stripe.products.create({
          name: data.name,
          default_price_data: {
            currency: "PKR",
            unit_amount: Math.round(data.price * 100),
          }
        })
        const updated: Product ={
          ...data,
          stripeId:createProduct.id,
          priceId:createProduct.default_price as string
        }
        return updated
      } else if (args.operation === "update") {
        const data = args.data as Product
        const updatedProduct = await stripe.products.update(data.stripeId!, {
          name: data.name,
          default_price: data.priceId!,
        })
        const updated: Product ={
          ...data,
          stripeId:updatedProduct.id,
          priceId:updatedProduct.default_price as string
        }
        return updated
      }
    }],
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      hasMany: false,
      admin: {
        condition: () => false,
      },
    },
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
      label: "Product details",
      // type: "richText",
      // required: true,
      // editor: slateEditor({
      //   admin: {
      //     elements: [
      //       "h1",
      //       "h2",
      //       "h3",
      //       "h4",
      //       "h5",
      //       "h6",
      //       "blockquote",
      //       "link",
      //       "ol",
      //       "ul",
      //       "textAlign",
      //       "indent",
      //       "relationship",
      //       "upload",
      //       "textAlign",
      //     ],
      //     leaves: ["bold", "code", "italic", "strikethrough", "underline"],
      //   },
      // }),
    },
    {
      name: "price",
      label: "Price in PKR",
      min: 0,
      max: 5000,
      type: "number",
      required: true,
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: PRODUCT_CATEGORIES.map(({ label, value }) => ({ label, value })),
      required: true,
    },
    {
      name: "images",
      label: "Product Images",
      type: "array",
      minRows: 1,
      maxRows: 5,
      required: true,
      labels: {
        singular: "Image",
        plural: "Images",
      },
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
    {
      name: "approvedForSale",
      label: "Product Status",
      type: "select",
      defaultValue: "pending",
      access: {
        create: ({ req }) => req.user.role === "admin",
        read: ({ req }) => req.user.role === "admin",
        update: ({ req }) => req.user.role === "admin",
      },
      options: [
        { label: "Pending Verification", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Denied", value: "denied" },
      ],
    },
    //                      NOTRELATABLE . will change later.....
    {
      name: "product_files",
      label: "Product File(s)",
      type: "relationship",
      required: true,
      relationTo: "product_files",
      hasMany: false,
    },

    //                     NOTRELATABLE . stripe payment excetera... will use pakistani methods later on
    {
      name: "priceId",
      access: {
        create: () => false,
        read: () => false,
        update: () => false,
      },
      type: "text",
      admin: {
        hidden: true,
      },
    },
    {
      name: "stripeId",
      access: {
        create: () => false,
        read: () => false,
        update: () => false,
      },
      type: "text",
      admin: {
        hidden: true,
      },
    },
  ],
};
