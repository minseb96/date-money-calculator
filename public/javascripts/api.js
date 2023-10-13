const getMoneyElement = () => {
    return document.querySelector('#money-value');
}

const onClickChargeMoney = async (isWeekday) => {
    const separator = isWeekday ? "weekday" : "weekend";
    const moneyEl = getMoneyElement();

    const {data: {amount, message}} = await axios({
        url: `/money/deposit/${separator}`,
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        data: {
            amount: Number(moneyEl.innerText.replace(",",""))
        }
    });
    alert(message);

    moneyEl.innerText = amount.toLocaleString("ko-KR");
}

const onClickRollbackChange = async () => {
    if(confirm("충전한 금액을 회수하시겠습니까?")){
        const moneyEl = getMoneyElement();

        const {data: {amount, message}} = await axios({
            url: `/money/rollback`,
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            data: {
                amount: Number(moneyEl.innerText.replace(",",""))
            }
        });

        alert(message);
        moneyEl.innerText = amount.toLocaleString("ko-KR");
    }
}

const onClickSpendMoneySave = async () => {
    const inputEl = document.querySelector('#priceInput');

    if(confirm(`${inputEl.value}원 을 소비로 등록 하시겠습니까?`)) {
        const moneyEl = getMoneyElement();

        const {data: {amount, message}} = await axios({
            url: `/money/pay`,
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            data: {
                amount: Number(inputEl.value.replace(",", "")),
                currentAmount: Number(moneyEl.innerText.replace(",",""))
            }
        });

        alert(message);
        moneyEl.innerText = amount.toLocaleString("ko-KR");
        onClickOpenRecordPayPopup(false);
    }
}

const onClickOpenRecordPayPopup = (active) => {
    const modalEl = document.querySelector('.price-modal');
    if(active) {
        modalEl.classList.add('modal-on');
        modalEl.classList.remove('modal-off');
    } else {
        modalEl.classList.add('modal-off');
        modalEl.classList.remove('modal-on');
    }
}

const onClickOpenConfigPopup = (active) => {
    const modalEl = document.querySelector('.config-modal');
    if(active) {
        modalEl.classList.add('modal-on');
        modalEl.classList.remove('modal-off');
    } else {
        modalEl.classList.add('modal-off');
        modalEl.classList.remove('modal-on');
    }
}

const onKeyUpPriceInput = (e) => {
    const value = Number(e.target.value.replaceAll(',', ''));
    if(isNaN(value)) {
        e.target.value = 0;
    }else {
        const formatValue = value.toLocaleString('ko-KR');
        e.target.value = formatValue;
    }
}

const onClickSaveMoneyConfig = async () => {
    const inputWeekday = document.querySelector('#configWeekday');
    const inputWeekend = document.querySelector('#configWeekend');

    if(confirm("설정 값을 저장하시겠습니까?")) {
        const {data: {message}} = await axios({
            url: `/money/config`,
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            data: {
                ...(inputWeekday.value && {weekdayPrice: Number(inputWeekday.value.replace(",", ""))}),
                ...(inputWeekend.value && {weekendPrice: Number(inputWeekend.value.replace(",", ""))}),
            }
        });

        alert(message);
        onClickOpenConfigPopup(false);
        window.location.reload();
    }
}