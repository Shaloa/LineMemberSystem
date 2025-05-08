import React, { useState } from "react";

const RegisterForm = () => {
  const [form, setForm] = useState({
    name: "",
    birth: "",
    gender: "",
    address: "",
	email: "",
    idImage: null,
    agreed: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append('name', form.name);
  formData.append('birth', form.birth);
  formData.append('gender', form.gender);
  formData.append('address', form.address);
  formDate.append('email', from.email);
  formData.append('idImage', form.idImage);
  formData.append('agreed', form.agreed);

  try {
    const res = await fetch('https://line-reserve-system.onrender.com/api/register', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      alert('登録が完了しました！');
    } else {
      alert('登録に失敗しました。');
    }
  } catch (err) {
    console.error(err);
    alert('エラーが発生しました。');
  }
};


  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-md mx-auto space-y-4 border rounded shadow">
      <h2 className="text-xl font-bold">個人情報登録フォーム</h2>

      <div>
        <label>名前</label>
        <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full border p-2" required />
      </div>

      <div>
        <label>生年月日</label>
        <input type="date" name="birth" value={form.birth} onChange={handleChange} className="w-full border p-2" required />
      </div>

      <div>
        <label>性別</label>
        <select name="gender" value={form.gender} onChange={handleChange} className="w-full border p-2" required>
          <option value="">選択してください</option>
          <option value="male">男性</option>
          <option value="female">女性</option>
          <option value="other">その他</option>
        </select>
      </div>

      <div>
        <label>住所</label>
        <input type="text" name="address" value={form.address} onChange={handleChange} className="w-full border p-2" required />
      </div>
	  
	  <div>
		<label>メールアドレス</label>
		<input
			type="email"
			name="email"
			value={form.email}
			onChange={handleChange}
			className="w-full border p-2"
			required
		/>
	  </div>

      <div>
        <label>身分証の画像</label>
        <input type="file" name="idImage" onChange={handleChange} className="w-full" accept="image/*" required />
      </div>

      <div className="border p-2 text-sm bg-gray-100">
        <p>プライバシーポリシーをここに表示します。個人情報は適切に管理されます。</p>
      </div>

      <div>
        <label>
          <input type="checkbox" name="agreed" checked={form.agreed} onChange={handleChange} />
          同意します
        </label>
      </div>

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        登録する
      </button>
    </form>
  );
};

export default RegisterForm;
