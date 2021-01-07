## Data Table

To create a data table:

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

