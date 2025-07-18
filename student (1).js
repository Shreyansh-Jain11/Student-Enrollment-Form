console.log("This is my Login2Xplore assignment");

const jpdbBaseURL = "https://api.login2explore.com:5577";
const jpdbIRL = "/api/irl";
const jpdbIML = "/api/iml";
const empDBName = "SCHOOL-DB";
const empRelationName = "STUDENT-TABLE";
const connToken = "90934977|-31949251033866495|90959607";

// Simple localStorage-based simulation since JPDB has CORS issues
const studentDB = {
    get: function(id) {
        const students = JSON.parse(localStorage.getItem('jpdb_students') || '{}');
        return students[id] || null;
    },
    
    set: function(id, data) {
        const students = JSON.parse(localStorage.getItem('jpdb_students') || '{}');
        students[id] = data;
        localStorage.setItem('jpdb_students', JSON.stringify(students));
    },
    
    exists: function(id) {
        return this.get(id) !== null;
    }
};

// Initialize form when page loads
$(document).ready(function() {
    resetForm();
});

// Function to get student by roll number
const getStudent = () => {
    const rollno = $("#rollno").val().trim();
    if (!rollno) {
        alert("Please enter a roll number");
        return;
    }

    console.log("Searching for roll no:", rollno);
    
    // Try JPDB first, fallback to localStorage
    $.ajax({
        url: '/api/jpdb/get',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({rollNo: rollno}),
        success: function(response) {
            if (response.status === 200) {
                // Student found in JPDB
                const record = JSON.parse(response.data).record;
                $("#studentName").val(record.name);
                $("#studentClass").val(record.class);
                $("#birthDate").val(record.birthDate);
                $("#address").val(record.address);
                $("#enrollmentDate").val(record.enrollmentDate);
                
                localStorage.setItem("recno", JSON.parse(response.data).rec_no);
                
                $("#rollno").prop("disabled", true);
                $("#save").prop("disabled", true);
                $("#change").prop("disabled", false);
                $("#reset").prop("disabled", false);
                
                $("#studentName").focus();
                alert("Student found in JPDB!");
            } else {
                // Try localStorage fallback
                const student = studentDB.get(rollno);
                if (student) {
                    fillFormFromLocal(student);
                } else {
                    enableNewStudentMode();
                }
            }
        },
        error: function() {
            // Fallback to localStorage
            const student = studentDB.get(rollno);
            if (student) {
                fillFormFromLocal(student);
            } else {
                enableNewStudentMode();
            }
        }
    });
};

const fillFormFromLocal = (student) => {
    $("#studentName").val(student.name);
    $("#studentClass").val(student.class);
    $("#birthDate").val(student.birthDate);
    $("#address").val(student.address);
    $("#enrollmentDate").val(student.enrollmentDate);
    
    $("#rollno").prop("disabled", true);
    $("#save").prop("disabled", true);
    $("#change").prop("disabled", false);
    $("#reset").prop("disabled", false);
    
    $("#studentName").focus();
    alert("Student found locally!");
};

const enableNewStudentMode = () => {
    clearForm();
    $("#rollno").prop("disabled", false);
    $("#save").prop("disabled", false);
    $("#change").prop("disabled", true);
    $("#reset").prop("disabled", false);
    
    $("#studentName").focus();
    alert("Student not found. You can add a new student.");
};

// Function to validate form data
const validateData = () => {
    const rollno = $("#rollno").val().trim();
    const studentName = $("#studentName").val().trim();
    const studentClass = $("#studentClass").val().trim();
    const birthDate = $("#birthDate").val();
    const address = $("#address").val().trim();
    const enrollmentDate = $("#enrollmentDate").val();

    if (!rollno) {
        alert("Roll No. is missing");
        $("#rollno").focus();
        return null;
    }

    if (!studentName) {
        alert("Student name is missing");
        $("#studentName").focus();
        return null;
    }

    if (!studentClass) {
        alert("Student class is missing");
        $("#studentClass").focus();
        return null;
    }

    if (!birthDate) {
        alert("Date of birth is missing");
        $("#birthDate").focus();
        return null;
    }

    if (!address) {
        alert("Address is missing");
        $("#address").focus();
        return null;
    }

    if (!enrollmentDate) {
        alert("Date of enrollment is missing");
        $("#enrollmentDate").focus();
        return null;
    }

    return {
        id: rollno,
        name: studentName,
        class: studentClass,
        birthDate: birthDate,
        address: address,
        enrollmentDate: enrollmentDate
    };
};

// Function to save new student data
const saveData = () => {
    const studentData = validateData();
    if (!studentData) return;

    console.log("Saving data:", studentData);

    // Map to JPDB format
    const jpdbData = {
        rollNo: studentData.id,
        name: studentData.name,
        class: studentData.class,
        birthDate: studentData.birthDate,
        address: studentData.address,
        enrollmentDate: studentData.enrollmentDate
    };

    // Try saving to JPDB first
    $.ajax({
        url: '/api/jpdb/put',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(jpdbData),
        success: function(response) {
            if (response.status === 200) {
                alert("Student data saved to JsonPowerDB successfully!");
                $("#save").prop("disabled", true);
                $("#change").prop("disabled", false);
                $("#rollno").prop("disabled", true);
            } else {
                saveToLocalStorage(studentData);
            }
        },
        error: function() {
            console.log("JPDB failed, saving locally");
            saveToLocalStorage(studentData);
        }
    });
};

const saveToLocalStorage = (studentData) => {
    // Check if student already exists locally
    if (studentDB.exists(studentData.id)) {
        alert("Student with this roll number already exists. Use Update to modify.");
        return;
    }

    // Save to localStorage
    studentDB.set(studentData.id, studentData);
    
    alert("Student data saved locally (JPDB unavailable)!");
    
    // Enable update/change buttons, disable save
    $("#save").prop("disabled", true);
    $("#change").prop("disabled", false);
    $("#rollno").prop("disabled", true);
};

// Function to update existing student data
const changeData = () => {
    const studentData = validateData();
    if (!studentData) return;

    console.log("Updating data:", studentData);

    // Map to JPDB format
    const jpdbData = {
        rollNo: studentData.id,
        name: studentData.name,
        class: studentData.class,
        birthDate: studentData.birthDate,
        address: studentData.address,
        enrollmentDate: studentData.enrollmentDate
    };

    // Try updating in JPDB first
    $.ajax({
        url: '/api/jpdb/update',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            recNo: localStorage.getItem("recno"),
            data: jpdbData
        }),
        success: function(response) {
            if (response.status === 200) {
                alert("Student data updated in JsonPowerDB successfully!");
                resetForm();
            } else {
                updateLocalStorage(studentData);
            }
        },
        error: function() {
            console.log("JPDB update failed, updating locally");
            updateLocalStorage(studentData);
        }
    });
};

const updateLocalStorage = (studentData) => {
    // Save updated data to localStorage
    studentDB.set(studentData.id, studentData);
    
    alert("Student data updated locally (JPDB unavailable)!");
    resetForm();
};

// Function to reset form
const resetForm = () => {
    $("#rollno, #studentName, #studentClass, #birthDate, #address, #enrollmentDate").val("");
    $("#rollno").prop("disabled", false);
    $("#save, #change").prop("disabled", true);
    $("#reset").prop("disabled", false);
    $("#rollno").focus();
};

// Function to clear form fields except roll number
const clearForm = () => {
    $("#studentName, #studentClass, #birthDate, #address, #enrollmentDate").val("");
};



// JPDB Helper Functions (for reference, not used due to CORS)
function createGET_BY_KEYRequest(token, dbName, relationName, jsonObjStr) {
    return JSON.stringify({
        "token": token,
        "cmd": "GET_BY_KEY",
        "dbName": dbName,
        "rel": relationName,
        "jsonStr": JSON.parse(jsonObjStr)
    });
}

function createPUTRequest(token, jsonObjStr, dbName, relationName) {
    return JSON.stringify({
        "token": token,
        "cmd": "PUT",
        "dbName": dbName,
        "rel": relationName,
        "jsonStr": JSON.parse(jsonObjStr)
    });
}

function createUPDATERecordRequest(token, jsonObjStr, dbName, relationName, recNo) {
    return JSON.stringify({
        "token": token,
        "cmd": "UPDATE",
        "dbName": dbName,
        "rel": relationName,
        "jsonStr": JSON.parse(jsonObjStr)
    });
}