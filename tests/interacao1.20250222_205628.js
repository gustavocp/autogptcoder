// Código completo da API GraphQL em JavaScript

const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type Product {
    id: ID!
    name: String!
    description: String!
    price: Float!
    category: Category
  }

  type Category {
    id: ID!
    name: String!
    products: [Product]
  }

  type Query {
    products: [Product]
    categories: [Category]
  }

  type Mutation {
    createProduct(name: String!, description: String!, price: Float!, categoryId: ID): Product
    updateProduct(id: ID!, name: String, description: String, price: Float, categoryId: ID): Product
    deleteProduct(id: ID!): Product
  }
`);

const resolvers = {
  Query: {
    products: () => products,
    categories: () => categories,
  },
  Mutation: {
    createProduct: (_, args) => {
      const product = { id: productId++, ...args };
      products.push(product);
      return product;
    },
    updateProduct: (_, args) => {
      const product = products.find(p => p.id === args.id);
      if (product) {
        Object.assign(product, args);
        return product;
      }
      return null;
    },
    deleteProduct: (_, args) => {
      const index = products.findIndex(p => p.id === args.id);
      if (index !== -1) {
        const deletedProduct = products.splice(index, 1)[0];
        return deletedProduct;
      }
      return null;
    },
  },
};

const server = new ApolloServer({ typeDefs: schema, resolvers });
const app = express();
server.applyMiddleware({ app });

app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);