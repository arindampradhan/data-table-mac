## Data Table

To create a data table:

[**Demo**](https://5ff720d03bfacf03803049fa--practical-sinoussi-ad88f4.netlify.app/)

```js
const table = new TableFactory("document-id");
table.setConfig({
  countPerPage: 10,
  headerFix: true,
  isPaginated: true,
  debug: false,
});
table.load(dataList);
```

