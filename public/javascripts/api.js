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
    const inputEl = document.querySelector('.price-input');

    if(confirm(`${inputEl.value.toLocaleString("ko-KR")}원 을 소비로 등록 하시겠습니까?`)) {
        const moneyEl = getMoneyElement();

        const {data: {amount, message}} = await axios({
            url: `/money/pay`,
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            data: {
                amount: Number(inputEl.value),
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