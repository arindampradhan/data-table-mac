// TableFactory

const log = console.log;
let renderCounter = 0;

class TableFactory {
  constructor(nodeId) {
    const node = document.getElementById(nodeId);
    if (!nodeId) {
      this._RequiredError("nodeId");
    }
    if (!node) {
      throw Error(`Node with the id: ${nodeId} not found in dom.`);
    }

    this.defaults = {
      config: {
        countPerpage: 5,
        headerFix: false,
        initalPage: 1,
        isPaginated: true,
        debug: false,
      },
    };

    this.config = this.defaults.config;
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
    this.searchHeadersText = [];
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
  _setPageData(data, onlyRenderTable) {
    // update triggers - this._setData(), this.config.countPerpage, this._currPage
    let d = data || this.getData();
    if (!this.config.isPaginated) {
      this.pageData = d;
    } else {
      this.pageData = d.slice(
        (this._currPage - 1) * this.config.countPerpage,
        this._currPage * this.config.countPerpage
      );
    }

    this._isRendered && this.render(onlyRenderTable);
  }

  _titleize(sentence) {
    if (!sentence.split) return sentence;
    let _titleizeWord = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
      },
      result = [];
    sentence.split(" ").forEach(function (w) {
      result.push(_titleizeWord(w));
    });
    return result.join(" ");
  }

  _setPageNumbers() {
    // logic
    let arr = [1, 2, 3, 4, 5];
    if (this._currPage > 2) {
      arr = [
        this._currPage - 2,
        this._currPage - 1,
        this._currPage,
        this._currPage + 1,
        this._currPage + 2,
      ];
    }
    if (this._currPage >= this._totalPages - 1) {
      arr = [
        this._totalPages - 4,
        this._totalPages - 3,
        this._totalPages - 2,
        this._totalPages - 1,
        this._totalPages,
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

  setPageCount(pageCount) {
    this.config = Object.assign({}, this.config, {
      countPerpage: parseInt(pageCount),
    });
    this._totalPages = Math.ceil(this.data.length / this.config.countPerpage);
    this._setPageData();
  }

  // render -  trigger
  // searchConfig {
  //   columnIndex,
  //   searchText,
  //   _onlyTable,
  //   _onlyTableBody
  // }
  setSearch(searchConfig) {
    const columnIndex = searchConfig.columnIndex;
    const searchText = searchConfig.searchText;
    const filteredData = this.getData().filter((rowData) => {
      let qStr = rowData.join(" ");
      if (columnIndex !== undefined) {
        const filterMap = this.searchHeadersText
          .map((o, index) => {
            return JSON.stringify(rowData[index]).search(o) > -1 ? 1: 0;
          })
        return filterMap.reduce((a, b) => a * b, 1);
      }
      return qStr.search(searchText) > -1;
    });
    // exclusive call
    this.pageData = this.config.isPaginated
      ? filteredData.slice(0, this.config.countPerpage)
      : filteredData;
    this._isRendered &&
      this.render(searchConfig._onlyTable, searchConfig._onlyTableBody);
  }

  setSort(columnId, order) {
    this.sorting[columnId] = order;

    const data = this.getData();
    if (data && data.length) {
      this.sorting = this.sorting.map((o) => 0); // reset
      this.sorting[columnId] = order;
      // let d = JSON.parse(JSON.stringify(data))
      const sortedArray = data.sort((a, b) => {
        if (a[columnId] > b[columnId]) {
          return order;
        } else {
          return -order;
        }
      });
      this._setPageData(sortedArray, true);
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
    this.searchHeadersText = Array.from(
      { length: dataList.columns.length },
      () => ""
    ); // set everything to 0
    this._totalPages = Math.ceil(
      dataList.data.length / this.config.countPerpage
    );
    if (this._totalPages < 2) {
      this.config.isPaginated = false;
    }
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
      this.setSearch({ searchText: this.searchText, _onlyTable: true });
    };

    const resetNode = node.querySelector('span[action="reset"]');
    resetNode.addEventListener("click", () => {
      this._currPage = 1;
      this.searchText = "";
      this.config = JSON.parse(JSON.stringify(this.defaults.config));
      this.load(this._initData);
    });
  }

  _listenEntriesBox() {
    const node = this.getNode();
    const inputNode = node.querySelector(`select[data-id="entries-count"]`);
    inputNode.addEventListener("change", (e) => {
      this.entriesCount = e.target.value || 5;
      this.setPageCount(this.entriesCount);
    });
  }

  _listenPagination() {
    const node = this.getNode();
    this.paginations.forEach((index) => {
      node
        .querySelector(`button[pagination-no="${index}"]`)
        .addEventListener("click", () => {
          this.setPage(index);
        });
    });

    node
      .querySelector(`button[pagination-no="next"]`)
      .addEventListener("click", () => {
        this.setPage(this._currPage + 1);
      });

    node
      .querySelector(`button[pagination-no="previous"]`)
      .addEventListener("click", () => {
        this.setPage(this._currPage - 1);
      });
  }

  _listenHeaderSearch() {
    const node = this.getNode();
    this.columns.forEach((elem, index) => {
      const inputNode = node.querySelector(
        `input[action-id="search-by-${index}"]`
      );
      inputNode.onkeyup = (e) => {
        this.searchHeadersText[index] = e.target.value || "";
        this.setSearch({
          searchText: this.searchHeadersText[index],
          _onlyTableBody: true,
          columnIndex: index,
        });
      };
    });
  }

  _listenPlank() {
    const node = this.getNode();
    let content = node.querySelector("table"),
      scrollStep = 400;
    node.querySelector(".plank").addEventListener("click", (e) => {
      e.preventDefault();
      let sl = content.scrollLeft,
        cw = content.scrollWidth;

      if (sl + scrollStep >= cw) {
        content.scrollTo({
          top: 0,
          left: cw,
          behavior: "smooth",
        });
      } else {
        content.scrollTo({
          top: 0,
          left: sl + scrollStep,
          behavior: "smooth",
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
    this._listenHeaderSearch();
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

  _templateHeaderSearch() {
    let dom = "";
    this.searchHeadersText.forEach((headSearchText, index) => {
      const element = this.columns[index];
      dom += `
        <th column-id="input-${index}" class="table-header-column-input">
          <input value="${headSearchText}" action-id="search-by-${index}" placeholder="${this._titleize(
        element
      )} Search..." name="${element}" />
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
    return `<tr style="height:5rem; position: relative;"><td style="margin: 0 auto;width: 100%;top: 9rem;position: absolute; text-align: center;color: #999;">No Data Found!</td></tr>`;
  }

  _templatePagination() {
    // template
    this._setPageNumbers();
    let dom = "";
    dom += `<button type="button" pagination-no="previous">Previous</button>`;
    this.paginations.forEach((o) => {
      dom += `<button type="button" class="number ${
        this._currPage === o ? "active" : ""
      }" pagination-no="${o}">${o}</button>`;
    });
    dom += `<button type="button" pagination-no="next">Next</button>`;
    return dom;
  }

  _templateSearchBox() {
    let dom = "";
    dom += `<input value="${this.searchText}" placeholder="search..." class="table-search-box" data-id="table-search-box" name="table-search-box"  />`;
    return dom;
  }

  _templateDropdown() {
    const dropdownList = Array.from(
      { length: this._totalPages },
      (_, i) => i + 1
    );
    let domDropdown = "";
    dropdownList.forEach((o) => {
      domDropdown += `<option ${
        o === this.config.countPerpage ? "selected disabled" : ""
      } value="${o}">${o}</option>`;
    });

    const _id = parseInt(Math.random(1, 1000) * 1000);

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

  render(_onlyTable, _onlyTableBody) {
    this._isRendered = true;
    const node = this.getNode();
    this.config.debug && log("rendered: ", renderCounter);
    renderCounter += 1;

    const domTableBody = `
      <tbody class="row-body" data-id="body">
        ${
          this.pageData.length === 0
            ? this._templateNoData()
            : this._templateList(this.pageData)
        }
      </tbody>
    `;

    const domTable = `
      <div class="table-container">
        <table entries="${this.pageData.length}" class="row-data">
          <thead class="row-head" data-id="head">
            ${this._templateHeader(this.columns)}
            ${this._templateHeaderSearch()}
          </thead>
          ${domTableBody}
        </table>
        <div class="plank"></div>
      </div>
    `;

    if (_onlyTableBody) {
      const tableNode = node.querySelector(`tbody[data-id="body"]`);
      this._setHtml(domTableBody, tableNode);
      this._addListeners();
      return;
    } else if (_onlyTable) {
      const tableNode = node.querySelector(".table-container");
      this._setHtml(domTable, tableNode);
      this._addListeners();
      return;
    }

    node.hasChildNodes() && this._setHtml("");
    const dom = `
      <div class="table-wrapper">
        <div class="header-table-utility">
          <div>
            ${this.config.isPaginated ? this._templateDropdown() : ""}
          </div>
          <div class="search-wrapper">
            ${this._templateSearchBox()}
            <span class="dot" action="reset" title="Reset"></span>
          </div>
        </div>
        ${domTable}
        ${
          this.config.isPaginated
            ? `
          <div class="row-message">
            Showing
            <span>${(this._currPage - 1) * this.config.countPerpage + 1} to
            ${Math.min(
              this._currPage * this.config.countPerpage,
              this.data.length
            )}</span>
            of <b><span>${this._totalPages}</span></b>
            entries
          </div>
          <div class="pagination-wrapper">
            ${this._templatePagination()}
          </div>
        `
            : ""
        }
      </div>
    `;

    this._setHtml(dom);
    this._addListeners();
  }
}
