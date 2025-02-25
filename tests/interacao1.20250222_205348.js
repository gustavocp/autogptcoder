const { ApolloServer, gql } = require('apollo-server');

// Definindo os tipos de dados para produtos e categorias
type Product {
  id: ID;
  name: String;
  description: String;
  price: Float;
  category: Category;
}

type Category {
  id: ID;
  name: String;
}

// Definindo a esquema da API GraphQL
const typeDefs = gql`
  type Query {
    products: [Product]
    product(id: ID!): Product
    categories: [Category]
    category(id: ID!): Category
  }

  type Mutation {
    createProduct(name: String!, description: String, price: Float, categoryId: ID!): Product
    updateProduct(id: ID!, name: String, description: String, price: Float, categoryId: ID!): Product
    deleteProduct(id: ID!): Boolean
    createCategory(name: String!): Category
    updateCategory(id: ID!, name: String): Category
    deleteCategory(id: ID!): Boolean
  }
`;

// Definindo os resolvers para cada tipo de operação (query e mutation)
const resolvers = {
  Query: {
    products: () => [...products], // Supondo que produtos é um array global
    product: (_, { id }) => products.find(p => p.id === id),
    categories: () => [...categories],
    category: (_, { id }) => categories.find(c => c.id === id)
  },
  Mutation: {
    createProduct: (_, { name, description, price, categoryId }) => {
      const newProduct = {
        id: products.length + 1,
        name,
        description,
        price,
        category: categories.find(c => c.id === categoryId)
      };
      products.push(newProduct);
      return newProduct;
    },
    updateProduct: (_, { id, name, description, price, categoryId }) => {
      const product = products.find(p => p.id === id);
      if (product) {
        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price !== undefined ? price : product.price;
        product.category = categories.find(c => c.id === categoryId) || product.category;
        return product;
      }
      return null; // ou lançar um erro
    },
    deleteProduct: (_, { id }) => {
      const index = products.findIndex(p => p.id === id);
      if (index !== -1) {
        products.splice(index, 1);
        return true;
      }
      return false; // ou lançar um erro
    },
    createCategory: (_, { name }) => {
      const newCategory = {
        id: categories.length + 1,
        name
      };
      categories.push(newCategory);
      return newCategory;
    },
    updateCategory: (_, { id, name }) => {
      const category = categories.find(c => c.id === id);
      if (category) {
        category.name = name || category.name;
        return category;
      }
      return null; // ou lançar um erro
    },
    deleteCategory: (_, { id }) => {
      const index = categories.findIndex(c => c.id === id);
      if (index !== -1) {
        categories.splice(index, 1);
        return true;
      }
      return false; // ou lançar um erro
    }
  }
};

// Inicializando a aplicação Apollo Server com o esquema e resolvers definidos
const server = new ApolloServer({ typeDefs, resolvers });

// Iniciando a API GraphQL na porta 4000
server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});