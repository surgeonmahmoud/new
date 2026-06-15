// ✅ جلب المستخدم الحالي
function getCurrentStudent() {
    try {
        return JSON.parse(localStorage.getItem("student"));
    } catch {
        return null;
    }
}

// ✅ تسجيل الدخول
async function loginStudent(phone, pin) {
    const { data, error } = await window.supabaseClient
        .from("students")
        .select("*")
        .eq("phone", phone)
        .eq("pin_hash", pin)
        .single();

    if (error || !data) {
        return { success: false };
    }

    localStorage.setItem("student", JSON.stringify(data));
    return { success: true, data };
}

// ✅ حماية الصفحات
function requireAuth() {
    const student = getCurrentStudent();

    if (!student) {
        window.location.href = "/login.html";
    }
}

// ✅ تسجيل خروج
function logout() {
    localStorage.removeItem("student");
    window.location.href = "/login.html";
}