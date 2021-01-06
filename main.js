// TableFactory

// perf utils
const memoize = function (fnToMemoize) {
  const memoizedCache = {}; // A closeure Object
  const constructPropertyFromArgs = function (fnToMemoize, args) {
    let propToCheck = [];
    propToCheck = propToCheck.concat(fnToMemoize.name, args);
    return propToCheck.join("|"); // A delimiter to join args
  };

  return function (...args) {
    const propToCheck = constructPropertyFromArgs(fnToMemoize, args);
    if (!memoizedCache[propToCheck]) {
      memoizedCache[propToCheck] = fnToMemoize(...args);
    } else {
      console.log("From Cache ");
    }
    return memoizedCache[propToCheck];
  };
};

class TableFactory {
  constructor(nodeId) {
    const node = document.getElementById(nodeId);
    if (!nodeId) {
      this._RequiredError("nodeId");
    }
    if (!node) {
      throw Error(`Node with the id: ${nodeId} not found in dom.`);
    }

    this.config = {
      countPerpage: 5,
      headerFix: false,
      initalPage: 1,
      isPaginated: false,
    };
    this._node = node;
    this._isRendered = false;
    this.pageNo = 0;
    this._currPage = 0;
    this._initData = {};
    this.columns = [];
    this.data = [];
    this.pageData = [];
    this.sorting = []; // (0) - no sorting | (1) - incrasing order | (-1) - decreasing order
    this._totalPages = 0;
    this.searchText = '';
  }

  // read only
  getNode() {
    return this._node;
  }

  setData(data) {
    this.data = data;
    this.pageData = data.slice(
      this._currPage * this.config.countPerpage,
      (this._currPage + 1) * this.config.countPerpage
    );
  }

  // setters
  load(dataList) {
    if (!dataList.data) {
      this._RequiredError("data key");
    }
    if (!dataList.columns) {
      this._RequiredError("columns key");
    }

    this._initData = dataList;
    this.data = dataList.data;
    this.columns = dataList.columns;
    this.sorting = Array.from({ length: dataList.columns.length }, () => 0); // set everything to 0
    this._totalPages = Math.floor(
      dataList.data.length / this.config.countPerpage
    );
    this.pageData = dataList.data.slice(
      this._currPage * this.config.countPerpage,
      (this._currPage + 1) * this.config.countPerpage
    );

    this.render();
  }

  setConfig(config) {
    this.config = Object.assign({}, this.config, config);
    this._isRendered && this.render();
  }

  setPageCount(pageCount) {
    this.config = Object.assign({}, this.config, { countPerpage: pageCount });

    this._isRendered && this.render();
  }

  setSearch(searchText) {
    const filteredData = this.data.filter(rowData => {
      const qStr = rowData.join(" ");
      return qStr.search(searchText) > -1
    })
    this.pageData = filteredData.slice(0,this.config.countPerpage);
    this._isRendered && this.render(true);
  }

  setPage(pageNo) {
    this.pageNo = pageNo;
    const pagePage = this.config.countPerpage;
    this.data.slice(pageNo * pagePage, (pageNo + 1) * pageNo);

    this._isRendered && this.render();
  }

  setSort(columnId, order) {
    this.sorting[columnId] = order;

    if (this._initData.data) {
      this.sorting = this.sorting.map((o) => 0); // reset
      this.sorting[columnId] = order;
      const sortedArray = this._initData.data.sort((a, b) => {
        if (a[columnId] > b[columnId]) {
          return order;
        } else {
          return -order;
        }
      });
      this.setData(sortedArray);
    }

    this._isRendered && this.render();
  }

  _setHtml(html, node) {
    let n = node || this.getNode();
    n.innerHTML = html;
  }

  // errors
  _RequiredError(key) {
    throw Error(`${key} is required!`);
  }

  // render listeners
  _listenChevron() {
    const node = this.getNode();
    this.columns.forEach((head, index) => {
      node
        .querySelector(`th[column-id="${index}"]`)
        .addEventListener("click", (e) => {
          if (this.sorting[index] === 1) {
            this.setSort(index, -1);
          } else if (this.sorting[index] === -1) {
            this.setSort(index, 1);
          } else {
            this.setSort(index, 1);
          }
        });
    });
  }

  _listenSearchBox() {
    const node = this.getNode();
    const inputNode = node.querySelector(`input[data-id="table-search-box"]`);
    inputNode.onkeyup = (e) => {
      this.searchText = e.target.value;
      this.setSearch(this.searchText);
    };
  }

  _addListeners() {
    this._listenChevron();
    this._listenSearchBox();
  }

  // render Utils
  _templateRow(rowData) {
    if (!Array.isArray(rowData)) {
      this._RequiredError("rowData: array type");
    }

    let dom = "";
    rowData.forEach((element) => {
      dom += `<td class="row-item" data-id="row-item">${element}</td>`;
    });
    return dom;
  }

  _templateHeader(rowData) {
    if (!Array.isArray(rowData)) {
      this._RequiredError("rowData: array type");
    }
    let dom = "";
    rowData.forEach((element, index) => {
      dom += `
        <th column-id="${index}" class="table-head">
          <span>${element}</span>
          <i column-id="${index}"
            class="row-header--chevron ${
              this.sorting[index] === 1 ? "up" : ""
            } ${this.sorting[index] === -1 ? "down" : ""}"
          ></i>
        </th>
      `;
    });
    return `<tr>${dom}</tr>`;
  }

  _templateList(data) {
    if (!Array.isArray(data)) {
      this._RequiredError("data: array type");
    }

    let dom = "";
    data.forEach((rowData) => {
      dom += `
        <tr class="row-line" data-id="row">
          ${this._templateRow(rowData)}
        </tr>
      `;
    });
    return dom;
  }

  _templateNoData() {
    return `<tr><td style="margin: 0 auto;width: 100%;position: absolute; text-align: center;color: #999;">No Data Found!</td></tr>`;
  }

  _templatePagination() {
    let dom = ''
    let arr=[1,2,3,4,5];
    if(this._currPage > 2 && this._currPage < this._totalPages -2) {
      arr = [this._currPage-2,this._currPage-1,this._currPage,this._currPage+ 1,this._currPage+ 2];
    }
    dom += "<span>Previous</span>";
    arr.forEach(o => {
      dom += `<span class="number" pagination-no="${o}">${o}</span>`;
    })
    dom += "<span>Next</span>";
    return dom;
  }

  _templateSearchBox() {
    let dom = "";

    dom += `<input value="${this.searchText}" placeholder="search..." class="table-search-box" data-id="table-search-box" name="table-search-box"  />`;

    return dom;
  }

  _templateDropdown() {
    let dom = "asddas";
    return dom;
  }

  render(_onlyTable) {
    this._isRendered = true;

    const node = this.getNode();

    const domTable = `
      <table entries="${this.pageData.length}" class="row-data">
        <thead class="row-head" data-id="head">
          ${this._templateHeader(this.columns)}
        </thead>
        <tbody class="row-body" data-id="body">
          ${
            this.pageData.length === 0
              ? this._templateNoData()
              : this._templateList(this.pageData)
          }
        </tbody>
      </table>
    `;

    if(_onlyTable) {
      const tableNode = node.querySelector('table');
      this._setHtml(domTable, tableNode);
      this._addListeners();
      return
    }

    node.hasChildNodes() && this._setHtml("");
    const dom = `
      <div class="table-wrapper">
        <div class="header-table-utility">
          <div>${this._templateDropdown()}</div>
          <div class="search-wrapper">${this._templateSearchBox()}</div>
        </div>
        ${domTable}
        <div class="row-message">
          Showing
          <span>${this._currPage * this.config.countPerpage} to
          ${(this._currPage + 1) * this.config.countPerpage}</span>
          of <b><span>${this._totalPages}</span></b> entries
        </div>
        <div class="pagination-wrapper">
          ${this._templatePagination()}
        </div>
        <div class="plank"></div>
      </div>
    `;

    this._setHtml(dom);
    this._addListeners();
  }
}

let table;
const dataListSample = {
  data: [
    ["Mike", 33, "mike@murphy.com", 170.12],
    ["John", 82, "john@conway.com", 170.52],
    ["Sara", 26, "sara@keegan.com", 171],
    ["John12", 82, "asd@conway.com", 170.52],
    ["Joasdhn", 82, "jodfasadhn@conway.com", 171.52],
  ],
  columns: ["Name", "Age", "Email", "Height(cm)"],
};

fetch("/MOCK_DATA.JSON")
  .then((r) => r.json())
  .then((data) => {
    const columns = Object.keys(data[0]);
    let _data = data.map((o) => {
      return columns.map((__) => {
        return o[__];
      });
    });

    table = new TableFactory("data-table");
    table.setConfig({
      countPerPage: 10,
      headerFix: true,
      isPaginated: false,
    });
    const dataList = {
      data: _data,
      columns: columns,
    };
    table.load(dataList);
  });
