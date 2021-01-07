// TableFactory

const log = console.log;
let renderCounter = 0;

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
    this._currPage = 1;
    this._initData = {};
    this.columns = [];
    this.data = [];
    this.pageData = [];
    this.sorting = []; // (0) - no sorting | (1) - incrasing order | (-1) - decreasing order
    this._totalPages = 0;
    this.searchText = "";
    this.entriesCount = "";
    this.paginations = [];
  }

  // read only
  getNode() {
    return this._node;
  }

  // read only
  getData() {
    return this.data;
  }

  // setters
  _setData(data) {
    this.data = data;
  }

  // render -  trigger
  _setPageData(data) {
    // update triggers - this._setData(), this.config.countPerpage, this._currPage
    let d = data || this.getData();
    if(!this.config.isPaginated) {
      this.pageData = d;
    } else {
      this.pageData = d.slice(
        (this._currPage - 1) * this.config.countPerpage,
        this._currPage * this.config.countPerpage
      );
    }

    this._isRendered && this.render();
  }

  _setInitialPage() {
    // logic
    let arr = [1, 2, 3, 4, 5];
    if (this._currPage > 2 && this._currPage < this._totalPages - 2) {
      arr = [
        this._currPage - 2,
        this._currPage - 1,
        this._currPage,
        this._currPage + 1,
        this._currPage + 2,
      ];
    }
    if (this._totalPages < 5) {
      arr = Array.from({ length: this._totalPages }, (_, i) => i + 1);
    }
    this.paginations = arr;
  }

  // render -  trigger
  setPage(pageNo) {
    if (pageNo < 0) {
      this._currPage = this._totalPages - pageNo - 1;
    } else if (pageNo === 0) {
      this._currPage = this._totalPages - pageNo;
    } else if (pageNo > this._totalPages) {
      this._currPage = 1;
    } else {
      this._currPage = pageNo;
    }
    this._setPageData();
  }

  // render -  trigger
  setConfig(config) {
    this.config = Object.assign({}, this.config, config);
    this._isRendered && this.render();
  }

  // render -  trigger
  setPageCount(pageCount) {
    this.config = Object.assign({}, this.config, { countPerpage: pageCount });
    this.load(this._initData);
  }

  // render -  trigger
  setSearch(searchText) {
    const filteredData = this.getData().filter((rowData) => {
      const qStr = rowData.join(" ");
      return qStr.search(searchText) > -1;
    });
    // exclusive call
    this.pageData = filteredData.slice(0, this.config.countPerpage);
    this._isRendered && this.render(true);
  }

  setSort(columnId, order) {
    this.sorting[columnId] = order;

    const data = this.getData();
    if (data && data.length) {
      this.sorting = this.sorting.map((o) => 0); // reset
      this.sorting[columnId] = order;
      let d = JSON.parse(JSON.stringify(data))
      const sortedArray = d.concat().sort((a, b) => {
        if (a[columnId] > b[columnId]) {
          return order;
        } else {
          return -order;
        }
      });
      this._setPageData(sortedArray);
    }
  }

  _setHtml(html, node) {
    let n = node || this.getNode();
    n.innerHTML = html;
  }

  // render -  trigger
  load(dataList) {
    if (!dataList.data) {
      this._RequiredError("data key");
    }
    if (!dataList.columns) {
      this._RequiredError("columns key");
    }

    const jsonData = JSON.stringify(dataList); // remove ref
    this._initData = JSON.parse(jsonData);
    this._setData(dataList.data);
    this.columns = dataList.columns;
    this.sorting = Array.from({ length: dataList.columns.length }, () => 0); // set everything to 0
    this._totalPages = Math.floor(
      dataList.data.length / this.config.countPerpage
    );
    this._setPageData();
    this.render();
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

    const resetNode = node.querySelector('span[action="reset"]');
    resetNode.addEventListener('click', () => {
      this.setPage(1);
    })
  }

  _listenEntriesBox() {
    const node = this.getNode();
    const inputNode = node.querySelector(`input[data-id="entries-count"]`);
    console.log(inputNode)
    inputNode.onkeyup = (e) => {
      this.entriesCount = e.target.value || 2;
      this.setPageCount(this.entriesCount);
    };

  }

  _listenPagination() {
    const node = this.getNode();
    this.paginations.forEach((index) => {
      node
        .querySelector(`span[pagination-no="${index}"]`)
        .addEventListener("click", () => {
          this.setPage(index);
        });
    });

    node
      .querySelector(`span[pagination-no="next"]`)
      .addEventListener("click", () => {
        this.setPage(this._currPage + 1);
      });

    node
      .querySelector(`span[pagination-no="previous"]`)
      .addEventListener("click", () => {
        this.setPage(this._currPage - 1);
      });
  }

  _listenPlank() {
    const node = this.getNode();
    let content = node.querySelector('table'), scrollStep = 400;
    node.querySelector('.plank').addEventListener('click', (e) => {
      e.preventDefault();
      let sl = content.scrollLeft,
          cw = content.scrollWidth;

      if ((sl + scrollStep) >= cw) {
        content.scrollTo({
          top: 0,
          left: cw,
          behavior: 'smooth'
        });
      } else {
        content.scrollTo({
          top: 0,
          left: (sl + scrollStep),
          behavior: 'smooth'
        });
      }
    });
  }

  _addListeners() {
    this._listenChevron();
    this._listenSearchBox();
    this._listenPlank();
    this.config.isPaginated && this._listenPagination();
    this.config.isPaginated && this._listenEntriesBox();
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
    // template
    this._setInitialPage();
    let dom = "";
    dom += `<span pagination-no="previous">Previous</span>`;
    this.paginations.forEach((o) => {
      dom += `<span class="number ${
        this._currPage === o ? "active" : ""
      }" pagination-no="${o}">${o}</span>`;
    });
    dom += `<span pagination-no="next">Next</span>`;
    return dom;
  }

  _templateSearchBox() {
    let dom = "";
    dom += `<input value="${this.searchText}" placeholder="search..." class="table-search-box" data-id="table-search-box" name="table-search-box"  />`;
    return dom;
  }

  _templateDropdown() {
    const dropdownList = Array.from({ length: this._totalPages }, (_, i) => i + 1);
    let domDropdown = '';
    dropdownList.forEach(o => {
      domDropdown += `<option ${o == 5 ? 'selected disabled': ''} value="${o}">${o}</option>`;
    })

    const _id = parseInt(Math.random(1,1000)*1000);

    let dom = `
      <form class="dropdown-entries">
        <div>
          <span>Show</span>
          <select data-id="entries-count" id="dropdown-${_id}" value="${this.entriesCount}" placeholder="count" name="perpage">
            ${domDropdown}
          </select>
          <span>entries</span>
        </div>
      </form>
    `;
    return dom;
  }

  render(_onlyTable) {
    this._isRendered = true;
    const node = this.getNode();
    log('rendered', renderCounter)
    renderCounter += 1;

    const domTable = `
      <div class="table-container">
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
        <div class="plank"></div>
      </div>
    `;

    if (_onlyTable) {
      const tableNode = node.querySelector("table");
      this._setHtml(domTable, tableNode);
      this._addListeners();
      return;
    }

    node.hasChildNodes() && this._setHtml("");
    const dom = `
      <div class="table-wrapper">
        <div class="header-table-utility">
          <div>${this._templateDropdown()}</div>
          <div class="search-wrapper">
            ${this._templateSearchBox()}
            <span class="dot" action="reset" title="Reset"></span>
          </div>
        </div>
        ${domTable}
        ${this.config.isPaginated ? `
          <div class="row-message">
            Showing
            <span>${((this._currPage - 1 )* this.config.countPerpage) + 1} to
            ${this._currPage * this.config.countPerpage}</span>
            of <b><span>${this._totalPages}</span></b>
            entries
          </div>
          <div class="pagination-wrapper">
            ${this._templatePagination()}
          </div>
        `: ''}
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
      isPaginated: true,
    });
    const dataList = {
      data: _data,
      columns: columns,
    };
    table.load(dataList);
  });
